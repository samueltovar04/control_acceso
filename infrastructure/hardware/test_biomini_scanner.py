import unittest
from infrastructure.hardware.biomini_scanner import BioMiniScanner


class TestBioMiniScanner(unittest.TestCase):
    def test_mock_fallback_context_manager(self):
        with BioMiniScanner(lib_path="/tmp/non_existent_lib.dylib") as scanner:
            self.assertTrue(scanner.initialized)
            template = scanner.capture_template()
            self.assertIsNotNone(template)
            self.assertEqual(template, b"MOCK_TEMPLATE_DATA_TEST_1024")
        self.assertFalse(scanner.initialized)


if __name__ == "__main__":
    unittest.main()
