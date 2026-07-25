class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  static const String baseApiUrl = '$baseUrl/api';

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String socialLogin = '/auth/social';
  static const String refreshToken = '/auth/refresh';
  static const String resetPassword = '/auth/reset-password';

  // Profile
  static const String profile = '/profile/me';
  static const String photos = '/profile/photos';
  static const String location = '/profile/location';
  static const String settings = '/profile/settings';

  // Swipe
  static const String recommendations = '/swipe/recommendations';
  static const String swipe = '/swipe';
  static const String undoSwipe = '/swipe/undo';
  static const String whoLikedMe = '/swipe/who-liked-me';

  // Match / chat / report
  static const String matches = '/match';
  static const String messages = '/chat/messages';
  static const String report = '/report';
  static const String block = '/report/block';
}

class SocketConstants {
  static const String serverUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'ws://localhost:3000',
  );

  static const String joinMatch = 'join_match';
  static const String leaveMatch = 'leave_match';
  static const String sendMessage = 'send_message';
  static const String newMessage = 'new_message';
  static const String typing = 'typing';
  static const String markRead = 'mark_read';
  static const String messagesRead = 'messages_read';
  static const String userOnline = 'user_online';
  static const String userOffline = 'user_offline';
}
