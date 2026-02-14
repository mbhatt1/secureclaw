package ai.secureclaw.android.ui

import androidx.compose.runtime.Composable
import ai.secureclaw.android.MainViewModel
import ai.secureclaw.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
