# Project Tasks

- [ ] **Initialization**
    - [x] Create project structure (`server`, `web`)
    - [x] Initialize React Frontend
    - [x] Initialize FastAPI Backend
    - [x] Install Backend Dependencies

- [ ] **Backend Development**
    - [x] **Database Setup**
        - [x] Define `Task` model
        - [x] Define `Record` model
        - [x] Setup SQLite connection
    - [x] **Recorder Integration**
        - [x] Refactor `DouyinLiveRecorder` core logic
        - [x] Create `StreamFetcher` service
        - [x] Implement FFmpeg recording wrapper
    - [x] **Task Scheduler**
        - [x] Setup APScheduler
        - [x] Implement recording job logic
    - [x] **AI Integration**
        - [x] Implement `DashScope` client (ASR, Vision, LLM)
        - [x] Create processing pipeline (Audio/Frame extraction)
    - [x] **API Implementation**
        - [x] Task CRUD endpoints
        - [x] Recording list/details endpoints
        - [x] Configuration endpoints

- [x] **Frontend Development**
    - [x] **Setup**
        - [x] Install TailwindCSS & Shadcn/ui
        - [x] Setup Routing (React Router)
    - [x] **Pages**
        - [x] Dashboard (Task status)
        - [x] Create/Edit Task Form
        - [x] Recording List
        - [x] Analysis Report View (Video Player + Transcript + AI Report)
    - [x] **Integration**
        - [x] Connect to Backend APIs

- [ ] **Verification**
    - [ ] Test Recording Flow
    - [ ] Test AI Analysis Flow
    - [ ] Verify UI/UX
