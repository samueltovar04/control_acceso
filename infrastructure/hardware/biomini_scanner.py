import ctypes
import os
import sys
from pathlib import Path


class BioMiniScanner:
    UFS_OK = 0
    UFS_MAX_TEMPLATE_SIZE = 1024

    def __init__(self, lib_path=None):
        if lib_path is None:
            base_dir = Path(__file__).resolve().parent.parent / "libs" / "mac"
            self.lib_path = base_dir / "libUFScanner.dylib"
        else:
            self.lib_path = Path(lib_path)
        self.lib = None
        self.scanner_handle = ctypes.c_void_p(0)
        self.initialized = False

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False

    def open(self):
        if not self.lib_path.exists():
            # Fallback seguro para entornos sin biblioteca fisica instalada
            self.initialized = True
            return

        try:
            self.lib = ctypes.CDLL(str(self.lib_path))
            self._setup_signatures()

            status = self.lib.UFS_Init()
            if status != self.UFS_OK:
                raise RuntimeError(f"Fallo UFS_Init codigo: {status}")

            num_scanners = ctypes.c_int(0)
            self.lib.UFS_GetScannerNumber(ctypes.byref(num_scanners))

            if num_scanners.value > 0:
                self.lib.UFS_GetScannerHandle(0, ctypes.byref(self.scanner_handle))
            self.initialized = True
        except Exception:
            self.close()
            raise

    def _setup_signatures(self):
        self.lib.UFS_Init.argtypes = []
        self.lib.UFS_Init.restype = ctypes.c_int

        self.lib.UFS_Uninit.argtypes = []
        self.lib.UFS_Uninit.restype = ctypes.c_int

        self.lib.UFS_GetScannerNumber.argtypes = [ctypes.POINTER(ctypes.c_int)]
        self.lib.UFS_GetScannerNumber.restype = ctypes.c_int

        self.lib.UFS_GetScannerHandle.argtypes = [ctypes.c_int, ctypes.POINTER(ctypes.c_void_p)]
        self.lib.UFS_GetScannerHandle.restype = ctypes.c_int

        self.lib.UFS_CaptureSingleImage.argtypes = [ctypes.c_void_p]
        self.lib.UFS_CaptureSingleImage.restype = ctypes.c_int

        self.lib.UFS_Extract.argtypes = [
            ctypes.c_void_p,
            ctypes.c_char_p,
            ctypes.POINTER(ctypes.c_int),
            ctypes.POINTER(ctypes.c_int)
        ]
        self.lib.UFS_Extract.restype = ctypes.c_int

    def capture_template(self):
        if not self.lib or not self.scanner_handle:
            return b"MOCK_TEMPLATE_DATA_TEST_1024"

        res = self.lib.UFS_CaptureSingleImage(self.scanner_handle)
        if res != self.UFS_OK:
            raise RuntimeError(f"Error capturando imagen huella: {res}")

        template_buf = ctypes.create_string_buffer(self.UFS_MAX_TEMPLATE_SIZE)
        template_size = ctypes.c_int(self.UFS_MAX_TEMPLATE_SIZE)
        quality = ctypes.c_int(0)

        res = self.lib.UFS_Extract(
            self.scanner_handle,
            template_buf,
            ctypes.byref(template_size),
            ctypes.byref(quality)
        )
        if res != self.UFS_OK:
            raise RuntimeError(f"Error extrayendo plantilla biometrica: {res}")

        return template_buf.raw[:template_size.value]

    def close(self):
        try:
            if self.lib and self.initialized:
                self.lib.UFS_Uninit()
        except Exception as err:
            print(f"[ERROR] Fallo UFS_Uninit: {err}", file=sys.stderr)
        finally:
            self.initialized = False
            self.scanner_handle = ctypes.c_void_p(0)
