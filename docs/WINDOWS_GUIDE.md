# Windows 사용자 가이드

## 🪟 Windows에서 Chrome Extension 빌드 & 실행

### 필수 요구사항

1. **Node.js** 설치
   - [https://nodejs.org/](https://nodejs.org/) 접속
   - LTS 버전 다운로드 (현재 18.x 이상)
   - 설치 파일 실행
   - "Add to PATH" 옵션 체크 확인

2. **Chrome 브라우저** 설치
   - [https://www.google.com/chrome/](https://www.google.com/chrome/)

3. **텍스트 에디터** (선택사항)
   - VS Code 추천: [https://code.visualstudio.com/](https://code.visualstudio.com/)

### 빠른 시작

#### 방법 1: 배치 파일 사용 (초보자 추천)

1. **프로젝트 폴더 열기**
   - 파일 탐색기에서 `c:\Users\hyunl\chrome-translation-assistant` 열기

2. **빌드하기**
   - `build.bat` 더블클릭
   - 자동으로 빌드 진행
   - "BUILD SUCCESSFUL!" 메시지 확인

3. **Chrome에 로드**
   - Chrome 열기
   - 주소창에 `chrome://extensions/` 입력
   - 우측 상단 "개발자 모드" 켜기
   - "압축해제된 확장 프로그램 로드" 클릭
   - `dist` 폴더 선택

#### 방법 2: Command Prompt 사용

**Command Prompt 열기:**
- `Win + R` → `cmd` 입력 → Enter
- 또는 시작 → "명령 프롬프트" 검색

**명령어 실행:**
```cmd
cd c:\Users\hyunl\chrome-translation-assistant
npm install
npm run build
```

#### 방법 3: PowerShell 사용

**PowerShell 열기:**
- `Win + X` → "Windows PowerShell" 선택
- 또는 시작 → "PowerShell" 검색

**명령어 실행:**
```powershell
cd c:\Users\hyunl\chrome-translation-assistant
npm install
npm run build
```

### 개발 모드 (코드 수정 시)

**HMR (Hot Module Replacement) 지원:**

```cmd
# dev.bat 더블클릭 또는
npm run dev
```

- 코드 수정 시 자동으로 리로드
- Ctrl+C로 종료

### 폴더 구조

```
c:\Users\hyunl\chrome-translation-assistant\
│
├── build.bat              ← 더블클릭으로 빌드
├── dev.bat                ← 더블클릭으로 개발 서버 실행
│
├── dist\                  ← 빌드 결과 (Chrome에 로드할 폴더)
│   ├── manifest.json
│   ├── assets\
│   └── ...
│
├── src\                   ← 소스 코드
│   ├── background\
│   ├── content\
│   ├── sidepanel\
│   └── ...
│
└── chrome-translation-assistant.zip  ← Web Store 제출용
```

### Chrome Extension 로드 상세 가이드

**1단계: Extensions 페이지 열기**

방법 A: 주소창
```
chrome://extensions/
```

방법 B: 메뉴
```
메뉴(⋮) → 도구 더보기 → 확장 프로그램
```

**2단계: 개발자 모드 활성화**
- 우측 상단 "개발자 모드" 토글 클릭 (파란색으로 변경)

**3단계: Extension 로드**
- "압축해제된 확장 프로그램 로드" 버튼 클릭
- 폴더 선택 창에서 `c:\Users\hyunl\chrome-translation-assistant\dist` 선택
- "폴더 선택" 클릭

**4단계: 확인**
- Extension이 목록에 나타남
- 에러가 없으면 성공!

### 설정 가이드

**1. Options 페이지 열기**
```
Extension 아이콘 우클릭 → "옵션"
또는
chrome://extensions/ → Extension 상세 → "확장 프로그램 옵션"
```

**2. API Key 설정**
```
1. AI Provider 선택 (Claude/OpenAI/Gemini)
2. API Key 입력
   - Claude: https://console.anthropic.com/account/keys
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://makersuite.google.com/app/apikey
3. "Validate" 클릭해서 키 확인
```

**3. 언어 설정**
```
Target Language: Korean (한국어) 선택
```

**4. 자동 번역 설정**
```
☑ Auto-translate paragraphs
Detection Mode: Balanced (추천)
☑ Auto-translate on page load (선택사항)
☑ Exclude code blocks
```

**5. 저장**
```
"Save Settings" 클릭
"Settings saved successfully!" 메시지 확인
```

### 테스트 방법

**간단한 테스트:**

1. **Wikipedia 테스트**
   ```
   https://en.wikipedia.org/wiki/Python_(programming_language)
   ```
   - 페이지 로드 후 문단 자동 감지 확인
   - 문단에 파란색 왼쪽 테두리 확인
   - 마우스 올려서 🔄 버튼 표시 확인
   - 클릭해서 번역 확인

2. **키보드 단축키 테스트**
   ```
   Alt + T 누르기
   ```
   - 모든 문단이 한번에 토글됨

3. **콘솔 확인 (F12)**
   ```
   Auto Paragraph Manager: Initializing...
   Auto Paragraph Manager: Detecting paragraphs...
   Auto Paragraph Manager: Found X candidates
   ```

### 문제 해결

#### 문제 1: npm을 찾을 수 없습니다

**증상:**
```
'npm'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
```

**해결:**
1. Node.js 설치 확인
   ```cmd
   node --version
   ```
2. 설치 안되어있으면:
   - https://nodejs.org/ 접속
   - Windows Installer (.msi) 다운로드
   - 설치 후 Command Prompt 재시작

#### 문제 2: 권한 오류

**증상:**
```
Error: EACCES: permission denied
```

**해결:**
1. Command Prompt를 관리자 권한으로 실행
   - 시작 → "cmd" 검색 → 우클릭 → "관리자 권한으로 실행"

2. 또는 사용자 폴더에서 작업
   ```cmd
   cd %USERPROFILE%\chrome-translation-assistant
   ```

#### 문제 3: 빌드 실패

**증상:**
```
Build failed with errors
```

**해결:**
```cmd
# 1. node_modules 삭제
rmdir /s /q node_modules

# 2. package-lock.json 삭제
del package-lock.json

# 3. 재설치
npm install

# 4. 다시 빌드
npm run build
```

#### 문제 4: Extension 로드 실패

**증상:**
- "Manifest file is missing or unreadable"
- Extension이 작동하지 않음

**해결:**
1. dist 폴더 확인
   ```cmd
   dir dist
   ```
   - manifest.json 파일 있는지 확인

2. 다시 빌드
   ```cmd
   rmdir /s /q dist
   npm run build
   ```

3. Chrome Extension 페이지에서 "새로고침" 클릭

#### 문제 5: TypeScript 에러

**증상:**
```
Cannot find module 'typescript'
```

**해결:**
```cmd
npm install -D typescript
npm run build
```

### Windows 방화벽 설정

개발 서버 실행 시 방화벽 경고가 나타날 수 있습니다:

1. "액세스 허용" 클릭
2. 또는 수동 설정:
   ```
   제어판 → Windows Defender 방화벽
   → 앱 또는 기능 허용
   → Node.js 찾아서 체크
   ```

### 성능 최적화 (Windows)

**빌드 속도 향상:**

1. **Windows Defender 예외 추가**
   ```
   Windows 보안 → 바이러스 및 위협 방지
   → 설정 관리 → 제외 추가
   → 폴더: c:\Users\hyunl\chrome-translation-assistant\node_modules
   ```

2. **SSD 사용**
   - 프로젝트를 SSD에 위치시키면 빌드 속도 향상

### 유용한 Windows 단축키

- `Win + R`: 실행 창
- `Win + E`: 파일 탐색기
- `Ctrl + Shift + Esc`: 작업 관리자
- `Alt + Tab`: 프로그램 전환
- Chrome에서 `F12`: 개발자 도구
- Chrome에서 `Ctrl + Shift + R`: 강력 새로고침

### VS Code에서 개발 (추천)

**VS Code 설치:**
1. https://code.visualstudio.com/ 접속
2. Windows 버전 다운로드
3. 설치

**프로젝트 열기:**
```
1. VS Code 실행
2. File → Open Folder
3. chrome-translation-assistant 폴더 선택
```

**터미널에서 빌드:**
```
Ctrl + ` (백틱) : 터미널 열기
npm run build
```

**추천 Extensions:**
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

### 추가 도움말

**공식 문서:**
- Node.js: https://nodejs.org/
- Chrome Extensions: https://developer.chrome.com/docs/extensions/
- Vite: https://vitejs.dev/

**커뮤니티:**
- GitHub Issues: 프로젝트에서 문제 보고
- Stack Overflow: 기술 질문

### 다음 단계

1. ✅ 빌드 성공
2. ✅ Chrome에 로드
3. ✅ 설정 완료
4. ✅ 테스트 완료

**이제 할 일:**
- TESTING.md 체크리스트 완료
- 여러 웹사이트에서 테스트
- 버그 발견 시 GitHub Issues에 보고
- Chrome Web Store 제출 준비

---

**문제가 계속되면:**
- GitHub Issues에 에러 메시지와 함께 질문
- Windows 버전, Node.js 버전 포함
