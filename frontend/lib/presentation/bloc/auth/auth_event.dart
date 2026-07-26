import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class AppStarted extends AuthEvent {
  const AppStarted();
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  const LoginRequested(this.email, this.password);
  @override
  List<Object?> get props => [email, password];
}

class RegisterRequested extends AuthEvent {
  final Map<String, dynamic> data;
  const RegisterRequested(this.data);
  @override
  List<Object?> get props => [data];
}

class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}
