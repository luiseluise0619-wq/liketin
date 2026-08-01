import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:liketin/main.dart';

void main() {
  testWidgets('app builds and shows the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const LiketinApp());
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('liketin'), findsOneWidget);
  });
}
