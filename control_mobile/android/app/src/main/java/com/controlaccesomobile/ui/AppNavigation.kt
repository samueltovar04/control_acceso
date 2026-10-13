package com.controlaccesomobile.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.controlaccesomobile.viewmodel.AuthViewModel
import com.controlaccesomobile.viewmodel.HomeViewModel

object NavRoutes {
    const val LOGIN = "login"
    const val CHANGE_PASSWORD = "change_password"
    const val REGISTER_FRAME = "register_frame"
    const val DASHBOARD_HOME = "dashboard_home"
}

@Composable
fun AppNavigation(
    authViewModel: AuthViewModel,
    homeViewModel: HomeViewModel
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = NavRoutes.DASHBOARD_HOME
    ) {
        composable(NavRoutes.DASHBOARD_HOME) {
            DashboardHomeScreen(
                viewModel = homeViewModel,
                onNavigateToLogin = { navController.navigate(NavRoutes.LOGIN) }
            )
        }

        composable(NavRoutes.LOGIN) {
            LoginScreen(
                viewModel = authViewModel,
                onNavigateToHome = { navController.navigate(NavRoutes.DASHBOARD_HOME) },
                onNavigateToChangePassword = { navController.navigate(NavRoutes.CHANGE_PASSWORD) },
                onNavigateToRegisterFrame = { navController.navigate(NavRoutes.REGISTER_FRAME) }
            )
        }

        composable(NavRoutes.CHANGE_PASSWORD) {
            ChangePasswordScreen(
                viewModel = authViewModel,
                onNavigateBackToLogin = {
                    navController.navigate(NavRoutes.LOGIN) {
                        popUpTo(NavRoutes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(NavRoutes.REGISTER_FRAME) {
            RegisterFrameScreen(
                viewModel = authViewModel,
                onNavigateBackToLogin = {
                    navController.navigate(NavRoutes.LOGIN) {
                        popUpTo(NavRoutes.LOGIN) { inclusive = true }
                    }
                }
            )
        }
    }
}
