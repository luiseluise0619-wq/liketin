# liketin — Tinder 스타일 소개팅 앱

Flutter(클라이언트) + Node.js/Express(API) + PostgreSQL/Prisma + Redis + Socket.io 로 구성된 소개팅 앱입니다.

## 프로젝트 구조

```
liketin/
├── backend/            # Node.js + Express + Prisma REST/WebSocket API (실행 가능)
│   ├── src/
│   │   ├── config/     # database, redis, firebase
│   │   ├── controllers/
│   │   ├── middleware/  # auth, rateLimiter, errorHandler, upload
│   │   ├── routes/
│   │   ├── services/    # auth, profile, swipe, match, chat, notification, ai
│   │   ├── utils/       # jwt, encryption, location, validators, logger
│   │   ├── websocket/   # chat + WebRTC 시그널링
│   │   └── app.js
│   ├── prisma/schema.prisma
│   ├── swagger/swagger.json
│   └── tests/          # unit (DB 불필요) + integration (RUN_INTEGRATION=1)
├── frontend/           # Flutter 클라이언트 (테마/네트워킹 코어 + 화면 골격)
├── docs/ERD.md         # 데이터베이스 ERD (mermaid)
├── nginx/nginx.conf
├── docker-compose.yml
└── infrastructure/terraform/   # AWS ECS/RDS/ElastiCache
```

## 빠른 시작 (백엔드)

```bash
cd backend
cp .env.example .env          # 시크릿 채우기 (openssl rand -hex 32)
npm install
npx prisma generate
# DB가 있다면:
npx prisma migrate dev
npm run dev                   # http://localhost:3000  (docs: /api-docs)
```

Docker 로 전체 스택 실행:

```bash
docker compose up --build     # api + postgres + redis
```

## 테스트

```bash
cd backend
npm test                      # 유닛 테스트 (DB 불필요, 항상 통과)
RUN_INTEGRATION=1 DATABASE_URL=... npm test   # 통합 테스트 (DB 필요)
```

## 원본 코드 평가 (Kimi 생성물 → 정리 내역)

이 저장소는 초안(Kimi 생성)을 **실행 가능하도록 수정**해 커밋한 것입니다. 주요 수정:

| 문제 | 조치 |
|------|------|
| 컨트롤러들이 `prisma` 를 import 없이 사용 (런타임 크래시) | 모든 컨트롤러에 import 추가 |
| `database.js` 의 `log: ['query']` + `$on('query')` 조합 오류 | `emit: 'event'` 설정으로 수정 |
| 위치 기반 추천의 Prisma JSON 필터가 실제로 동작하지 않음 | 후보를 조회 후 Haversine 으로 앱 레이어 필터링 (+ Redis geo 인덱스 준비) |
| WebSocket 핸들러 이중 정의 | `websocket/index.js` 로 단일화 (chat + call) |
| Firebase 미설정 시 부팅 실패 | Firebase 옵션화 (미설정 시 관련 기능만 no-op) |
| 중복 스와이프 시 unique 제약 위반 크래시 | `upsert` 로 변경 |
| 테스트가 실 인프라 없이는 실패 | DB 불필요 유닛 테스트 추가, 통합 테스트는 플래그로 분리 |
| `app.js` 가 항상 listen → 테스트 import 불가 | `require.main === module` 로 분리 |

### 아직 남은 프로덕션 과제 (의도적 미구현)

- **CSRF / Refresh 토큰 무효화**: 현재 JWT stateless. 로그아웃 시 토큰 블랙리스트(Redis) 필요.
- **이미지 NSFW 검증**: `middleware/upload.js` 에 훅 지점만 존재. 실제 모더레이션 미연동.
- **AI 기능**(`aiService.js`): 결정론적 플레이스홀더. Gemini/Vision 연동 필요.
- **결제/프리미엄/부스트/스토리/영상통화**: 스키마·시그널링은 있으나 결제 게이트웨이 미연동.
- **거리 쿼리 스케일**: 대규모에서는 PostGIS 또는 Redis GEO 로 이전 권장.

즉 **잘 구조화된 MVP 스캐폴드**이며, 위 항목을 채우면 서비스 수준에 도달합니다.
