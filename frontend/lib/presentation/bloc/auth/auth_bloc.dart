import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repo;

  AuthBloc({AuthRepository? repository})
      : _repo = repository ?? AuthRepository(),
        super(const AuthInitial()) {
    on<AppStarted>(_onAppStarted);
    on<LoginRequested>(_onLogin);
    on<RegisterRequested>(_onRegister);
    on<LogoutRequested>(_onLogout);
  }

  Future<void> _onAppStarted(AppStarted event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    try {
      final restored = await _repo.restoreSession();
      if (!restored) {
        emit(const Unauthenticated());
        return;
      }
      final user = await _repo.getCurrentUser();
      emit(Authenticated(user));
    } catch (_) {
      emit(const Unauthenticated());
    }
  }

  Future<void> _onLogin(LoginRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    try {
      final res = await _repo.login(event.email, event.password);
      emit(Authenticated(res['user'] as Map<String, dynamic>));
    } catch (e) {
      emit(AuthError(_message(e)));
    }
  }

  Future<void> _onRegister(RegisterRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    try {
      final res = await _repo.register(event.data);
      emit(Authenticated(res['user'] as Map<String, dynamic>));
    } catch (e) {
      emit(AuthError(_message(e)));
    }
  }

  Future<void> _onLogout(LogoutRequested event, Emitter<AuthState> emit) async {
    await _repo.logout();
    emit(const Unauthenticated());
  }

  String _message(Object e) => e.toString().replaceFirst('Exception: ', '');
}
