package com.controlaccesomobile.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.controlaccesomobile.viewmodel.HomeDashboardState
import com.controlaccesomobile.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardHomeScreen(
    viewModel: HomeViewModel,
    onNavigateToLogin: () -> Unit
) {
    val state by viewModel.dashboardState.collectAsState()
    var showPaymentDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadProfileAndSubscribeWebSocket("192.168.1.140:8080", "VALID_TOKEN")
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Control de Acceso • Dashboard",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E88E5))
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF4F6F9))
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // SECCIÓN A: MEMBRESÍA Y ESTADO DE PAGOS
            SectionAMembresiaYPagos(
                state = state,
                onOpenPaymentDialog = { showPaymentDialog = true }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // SECCIÓN C: ALERTA DE DESCONEXIÓN (SI NO DETECTA PIEL)
            if (!state.vitalSigns.skinDetected) {
                SectionCAlertaDesconexion()
                Spacer(modifier = Modifier.height(16.dp))
            } else {
                // SECCIÓN B: SIGNOS VITALES IOT EN TIEMPO REAL
                SectionBSignosVitales(vitalSigns = state.vitalSigns)
            }
        }

        if (showPaymentDialog) {
            PaymentNotificationDialog(
                onDismiss = { showPaymentDialog = false },
                onSubmit = { monto, celular, banco, cedula, fechaPago, numeroReferencia ->
                    viewModel.notifyPayment(
                        monto = monto.toDoubleOrNull() ?: 50.0,
                        celular = celular,
                        banco = banco,
                        cedula = cedula,
                        fechaPago = fechaPago,
                        numeroReferencia = numeroReferencia
                    )
                    showPaymentDialog = false
                }
            )
        }
    }
}

@Composable
fun SectionAMembresiaYPagos(
    state: HomeDashboardState,
    onOpenPaymentDialog: () -> Unit
) {
    val isMoroso = state.userProfile.estadoPago == "MOROSO"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Bienvenido, ${state.userProfile.nombre} ${state.userProfile.apellido}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Membresía: ${state.userProfile.tipoMembresia}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF1E88E5),
                        fontWeight = FontWeight.Bold
                    )
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isMoroso) Color(0xFFFFEBEE) else Color(0xFFE8F5E9)
                ) {
                    Text(
                        text = if (isMoroso) "PAGO PENDIENTE" else "AL DÍA",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (isMoroso) Color(0xFFC62828) else Color(0xFF2E7D32)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (isMoroso) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFC62828))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "⚠️ Cuenta en Estado MOROSO",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Su membresía ha vencido. Regularice su pago para habilitar los torniquetes.",
                                color = Color(0xFFFFCDD2),
                                fontSize = 11.sp
                            )
                        }

                        Button(
                            onClick = onOpenPaymentDialog,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = if (state.paymentNotificationSent) "Procesando" else "Notificación de Pago / Pagar",
                                color = Color(0xFFC62828),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PaymentNotificationDialog(
    onDismiss: () -> Unit,
    onSubmit: (monto: String, celular: String, banco: String, cedula: String, fechaPago: String, numeroReferencia: String) -> Unit
) {
    var monto by remember { mutableStateOf("50.00") }
    var celular by remember { mutableStateOf("04121234567") }
    var banco by remember { mutableStateOf("Banesco") }
    var cedula by remember { mutableStateOf("V-18234567") }
    var fechaPago by remember { mutableStateOf("2026-03-01") }
    var numeroReferencia by remember { mutableStateOf("882193") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("💳 Notificación de Pago", fontWeight = FontWeight.Bold, color = Color(0xFF1E88E5))
        },
        text = {
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                Text("Ingrese los datos del reporte de transferencia / pago móvil:", style = MaterialTheme.typography.bodySmall, color = Color.Gray)

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = monto,
                    onValueChange = { monto = it },
                    label = { Text("Monto ($ / Bs)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = celular,
                    onValueChange = { celular = it },
                    label = { Text("Celular Emisor") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = banco,
                    onValueChange = { banco = it },
                    label = { Text("Banco Origen / Destino") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = cedula,
                    onValueChange = { cedula = it },
                    label = { Text("Cédula / DNI") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = fechaPago,
                    onValueChange = { fechaPago = it },
                    label = { Text("Fecha de Pago (AAAA-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = numeroReferencia,
                    onValueChange = { numeroReferencia = it },
                    label = { Text("Número de Referencia") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSubmit(monto, celular, banco, cedula, fechaPago, numeroReferencia)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
            ) {
                Text("Enviar Reporte de Pago", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
fun SectionBSignosVitales(vitalSigns: com.controlaccesomobile.model.VitalSignsPayload) {
    val bpmDuration = (60000 / vitalSigns.bpm.coerceAtLeast(40)).coerceIn(300, 1500)
    val infiniteTransition = rememberInfiniteTransition(label = "Heartbeat")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = bpmDuration / 2, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "HeartScale"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "📊 Telemetría en Tiempo Real (WebSocket)",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color(0xFF1E88E5)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .scale(scale)
                            .clip(CircleShape)
                            .background(Color(0xFFE53935)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("❤️", fontSize = 26.sp)
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text("Ritmo Cardíaco (ECG/PPG)", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = "${vitalSigns.bpm}",
                                fontSize = 36.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFC62828)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("BPM", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Oxígeno SpO2", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        Text(
                            text = "${vitalSigns.spo2}%",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E88E5)
                        )
                        Text("Excelente Nivel", fontSize = 10.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE0F2F1))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Temperatura", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        Text(
                            text = "${vitalSigns.temperatura} °C",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00897B)
                        )
                        Text("Rango Normal", fontSize = 10.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun SectionCAlertaDesconexion() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0)),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("⌚", fontSize = 48.sp)

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "⚠️ Alerta de Desconexión de Piel",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color(0xFFE65100)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Por favor, colóquese el brazalete en el brazo para iniciar la medición",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFFBF360C),
                fontWeight = FontWeight.Bold
            )
        }
    }
}
