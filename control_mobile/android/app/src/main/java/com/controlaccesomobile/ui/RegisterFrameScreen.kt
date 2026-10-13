package com.controlaccesomobile.ui

import android.graphics.Bitmap
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.controlaccesomobile.viewmodel.AuthUiState
import com.controlaccesomobile.viewmodel.AuthViewModel
import java.io.ByteArrayOutputStream

@Composable
fun RegisterFrameScreen(
    viewModel: AuthViewModel,
    onNavigateBackToLogin: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var nombre by remember { mutableStateOf("") }
    var apellido by remember { mutableStateOf("") }
    var documento by remember { mutableStateOf("") }
    var frameCaptured by remember { mutableStateOf<Bitmap?>(null) }
    var frameBase64String by remember { mutableStateOf("") }

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.RegisterFrameSuccess) {
            viewModel.resetState()
            onNavigateBackToLogin()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "📷 Registro por Fotograma Facial",
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E88E5)
                ),
                modifier = Modifier.padding(top = 16.dp, bottom = 8.dp)
            )

            Text(
                text = "Tome un fotograma de su rostro para enrolar su biometría en el servidor Quarkus.",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // CameraX Frame Preview Container
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE0E0E0)),
                contentAlignment = Alignment.Center
            ) {
                if (frameCaptured != null) {
                    Image(
                        bitmap = frameCaptured!!.asImageBitmap(),
                        contentDescription = "Fotograma Capturado",
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("👤", fontSize = 48.sp)
                        Text("Sin Fotograma", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = {
                    // Simulate CameraX Frame Capture & Base64 conversion
                    val bitmap = Bitmap.createBitmap(200, 200, Bitmap.Config.ARGB_8888)
                    frameCaptured = bitmap
                    val outputStream = ByteArrayOutputStream()
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
                    val bytes = outputStream.toByteArray()
                    frameBase64String = Base64.encodeToString(bytes, Base64.NO_WRAP)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00ACC1))
            ) {
                Text("📷 Capturar Fotograma en Vivo")
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = nombre,
                onValueChange = { nombre = it },
                label = { Text("Nombre") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = apellido,
                onValueChange = { apellido = it },
                label = { Text("Apellido") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = documento,
                onValueChange = { documento = it },
                label = { Text("Documento DNI") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo Electrónico") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(20.dp))

            if (uiState is AuthUiState.Loading) {
                CircularProgressIndicator(color = Color(0xFF1E88E5))
            } else {
                Button(
                    onClick = {
                        viewModel.registerWithFrame(
                            email = email,
                            nombre = nombre,
                            apellido = apellido,
                            documento = documento,
                            frameBase64 = frameBase64String.ifEmpty { "MOCK_FRAME_BASE64_IMAGE" }
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
                ) {
                    Text("Despachar Registro Biométrico", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
