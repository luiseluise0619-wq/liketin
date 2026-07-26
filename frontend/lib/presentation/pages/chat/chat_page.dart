import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/api_client.dart';
import '../../../services/storage_service.dart';

class ChatPage extends StatefulWidget {
  final String matchId;
  final String otherName;
  final String otherPhoto;
  final String? otherUserId;

  const ChatPage({
    super.key,
    required this.matchId,
    required this.otherName,
    required this.otherPhoto,
    this.otherUserId,
  });

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  io.Socket? _socket;
  bool _otherTyping = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _connect();
  }

  Future<void> _loadHistory() async {
    try {
      final res = await ApiClient().get('${ApiConstants.messages}/${widget.matchId}');
      final list = (res['messages'] as List?) ?? const [];
      setState(() {
        _messages
          ..clear()
          ..addAll(list.cast<Map<String, dynamic>>());
      });
      _scrollToBottom();
    } catch (_) {
      // Non-fatal: realtime still works for new messages.
    }
  }

  Future<void> _connect() async {
    final token = await StorageService.getAccessToken();
    final socket = io.io(
      SocketConstants.serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableForceNew()
          .build(),
    );

    socket.onConnect((_) => socket.emit(SocketConstants.joinMatch, widget.matchId));
    socket.on(SocketConstants.newMessage, (data) {
      setState(() => _messages.add(Map<String, dynamic>.from(data as Map)));
      _scrollToBottom();
    });
    socket.on(SocketConstants.typing, (data) {
      if (data is Map && data['userId'] == widget.otherUserId) {
        setState(() => _otherTyping = data['isTyping'] == true);
      }
    });

    _socket = socket;
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty || _socket == null) return;
    _socket!.emit(SocketConstants.sendMessage, {
      'matchId': widget.matchId,
      'content': text,
      'type': 'TEXT',
    });
    _controller.clear();
    _socket!.emit(SocketConstants.typing, {'matchId': widget.matchId, 'isTyping': false});
  }

  void _onChanged(String v) {
    _socket?.emit(SocketConstants.typing, {
      'matchId': widget.matchId,
      'isTyping': v.isNotEmpty,
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _socket?.emit(SocketConstants.leaveMatch, widget.matchId);
    _socket?.dispose();
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  bool _isMine(Map<String, dynamic> m) =>
      widget.otherUserId != null && m['senderId'] != widget.otherUserId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: widget.otherPhoto.isNotEmpty ? NetworkImage(widget.otherPhoto) : null,
              child: widget.otherPhoto.isEmpty ? const Icon(Icons.person, size: 18) : null,
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(widget.otherName, style: const TextStyle(fontSize: 16)),
                if (_otherTyping)
                  const Text('typing…', style: TextStyle(fontSize: 12, color: AppColors.primary)),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, i) => _bubble(_messages[i]),
            ),
          ),
          _inputBar(),
        ],
      ),
    );
  }

  Widget _bubble(Map<String, dynamic> m) {
    final mine = _isMine(m);
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: mine ? AppColors.primary : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(mine ? 18 : 4),
            bottomRight: Radius.circular(mine ? 4 : 18),
          ),
        ),
        child: Text(
          m['content']?.toString() ?? '',
          style: TextStyle(color: mine ? Colors.white : Colors.black87, fontSize: 16),
        ),
      ),
    );
  }

  Widget _inputBar() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                onChanged: _onChanged,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: InputDecoration(
                  hintText: 'Type a message…',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _send,
              child: const CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.primary,
                child: Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
