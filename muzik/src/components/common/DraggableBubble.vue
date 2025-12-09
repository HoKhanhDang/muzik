<template>
  <div
    ref="bubbleRef"
    class="draggable-bubble"
    :class="{
      'is-dragging': isDragging,
      'is-expanded': isExpanded,
      'is-running': timerStatus === 'running',
      'is-focus-mode': isFocusMode,
      'is-fullscreen': isFullscreen,
    }"
    :style="bubbleStyle"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <!-- Bubble Button with Timer Progress -->
    <div class="bubble-button" @click="toggleExpand">
      <!-- Progress Ring -->
      <svg class="progress-ring" width="60" height="60" v-if="timerStatus !== 'idle'">
        <circle
          class="progress-ring-circle"
          stroke="rgba(255, 255, 255, 0.3)"
          stroke-width="3"
          fill="transparent"
          r="27"
          cx="30"
          cy="30"
        />
        <circle
          class="progress-ring-circle-fill"
          :stroke="timerStatus === 'completed' ? '#4ade80' : '#fff'"
          stroke-width="3"
          fill="transparent"
          r="27"
          cx="30"
          cy="30"
          :style="progressRingStyle"
        />
      </svg>

      <div class="bubble-icon">
        <!-- Timer Icon when running -->
        <svg
          v-if="timerStatus === 'running' || timerStatus === 'paused'"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <!-- Checkmark when completed -->
        <svg
          v-else-if="timerStatus === 'completed'"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <!-- Plus when idle and collapsed -->
        <svg
          v-else-if="!isExpanded"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <!-- X when expanded -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      <!-- Mini time display on bubble -->
      <div class="bubble-time" v-if="timerStatus !== 'idle' && !isExpanded">
        {{ formatTime(remainingTime) }}
      </div>
    </div>

    <!-- Expanded Content with Side-by-Side Layout (Normal Mode) -->
    <transition name="expand">
      <div
        v-if="isExpanded && !isFullscreen"
        class="bubble-content-wrapper"
        @mousedown.stop
        @touchstart.stop
      >
        <!-- Fullscreen Toggle Button -->
        <button class="btn-fullscreen" @click="toggleFullscreen" title="Toàn màn hình">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            />
          </svg>
        </button>

        <!-- Left Panel: TodoList (Fixed) -->
        <div class="left-panel">
          <TodoList
            :tasks="tasks"
            :current-session-id="currentSession?.id"
            :is-fullscreen="false"
            @update:tasks="tasks = $event"
            @task-completed="handleTaskCompleted"
          />
        </div>

        <!-- Right Panel: Pomodoro -->
        <div class="right-panel">
          <div class="pomodoro-content">
            <!-- Status Badge (Floating) -->
            <div class="status-badge-floating" :class="statusClass">
              {{ statusText }}
            </div>

            <div class="content-body">
              <!-- Timer Display -->
              <div class="timer-display">
                <div class="time-circle">
                  <svg class="timer-progress" viewBox="0 0 200 200">
                    <!-- Define gradient for progress fill -->
                    <defs>
                      <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color: #667eea; stop-opacity: 1" />
                        <stop offset="100%" style="stop-color: #764ba2; stop-opacity: 1" />
                      </linearGradient>
                    </defs>

                    <circle class="timer-progress-bg" cx="100" cy="100" r="90" />
                    <circle
                      class="timer-progress-fill"
                      cx="100"
                      cy="100"
                      r="90"
                      :style="timerProgressStyle"
                      :class="{ completed: timerStatus === 'completed' }"
                    />
                  </svg>
                  <div class="time-text">
                    {{ formatTime(remainingTime) }}
                  </div>
                </div>
              </div>

              <!-- Time Settings (only show when idle) -->
              <div class="time-settings" v-if="timerStatus === 'idle'">
                <div class="setting-group">
                  <label>Giờ</label>
                  <input
                    type="number"
                    v-model.number="hours"
                    min="0"
                    max="23"
                    @input="updateTotalTime"
                  />
                </div>
                <div class="setting-group">
                  <label>Phút</label>
                  <input
                    type="number"
                    v-model.number="minutes"
                    min="0"
                    max="59"
                    @input="updateTotalTime"
                  />
                </div>
                <div class="setting-group">
                  <label>Giây</label>
                  <input
                    type="number"
                    v-model.number="seconds"
                    min="0"
                    max="59"
                    @input="updateTotalTime"
                  />
                </div>
              </div>

              <!-- Control Buttons -->
              <div class="controls">
                <!-- Start Button (when idle) -->
                <button
                  v-if="timerStatus === 'idle'"
                  class="btn btn-primary"
                  @click="startTimer"
                  :disabled="totalTime === 0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Bắt đầu
                </button>

                <!-- Pause/Resume Button (when running) -->
                <button
                  v-if="timerStatus === 'running'"
                  class="btn btn-warning"
                  @click="pauseTimer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Tạm dừng
                </button>

                <!-- Resume Button (when paused) -->
                <button
                  v-if="timerStatus === 'paused'"
                  class="btn btn-primary"
                  @click="resumeTimer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Tiếp tục
                </button>

                <!-- Reset Button (always show except when idle) -->
                <button v-if="timerStatus !== 'idle'" class="btn btn-secondary" @click="resetTimer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <polyline points="23 20 23 14 17 14" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  Đặt lại
                </button>

                <!-- Complete Button (when completed) -->
                <button
                  v-if="timerStatus === 'completed'"
                  class="btn btn-success"
                  @click="resetTimer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Hoàn thành
                </button>
              </div>

              <!-- Break Button Section -->
              <button class="btn-break" @click="handleStartBreak" title="Bắt đầu nghỉ ngơi 5 phút">
                <span>Relaxxx~~~</span>
              </button>

              <!-- Focus Mode Info -->
              <div class="focus-mode-info" v-if="isFocusMode">
                <div class="focus-icon">🎯</div>
                <p>Chế độ tập trung đang bật</p>
              </div>

              <!-- History Toggle Button -->
              <div class="history-toggle">
                <button class="btn btn-secondary" @click="showHistory = !showHistory">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {{ showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử' }}
                  <span class="badge" v-if="sessions.length > 0">{{ sessions.length }}</span>
                </button>
              </div>

              <!-- Session History -->
              <transition name="slide">
                <div v-if="showHistory" class="session-history">
                  <div class="history-header">
                    <h4>📊 Lịch sử phiên làm việc</h4>
                    <button
                      v-if="sessions.length > 0"
                      class="btn-clear"
                      @click="clearAllSessions"
                      title="Xóa tất cả"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Summary Stats -->
                  <div class="stats-summary" v-if="sessions.length > 0">
                    <div class="stat-item">
                      <div class="stat-value">
                        {{ sessions.filter((s) => s.status === 'completed').length }}
                      </div>
                      <div class="stat-label">Hoàn thành</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ sessions.length }}</div>
                      <div class="stat-label">Tổng phiên</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">
                        {{
                          Math.round(
                            (sessions.filter((s) => s.status === 'completed').length /
                              sessions.length) *
                              100,
                          ) || 0
                        }}%
                      </div>
                      <div class="stat-label">Tỷ lệ</div>
                    </div>
                  </div>

                  <!-- Session List -->
                  <div class="session-list" v-if="sessions.length > 0">
                    <div
                      v-for="session in sessions"
                      :key="session.id"
                      class="session-item"
                      :class="`status-${session.status}`"
                    >
                      <div class="session-main">
                        <div
                          class="session-status"
                          :style="{ backgroundColor: getStatusColor(session.status) }"
                        >
                          {{ getStatusText(session.status) }}
                        </div>
                        <div class="session-info">
                          <div class="session-time">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {{ formatDate(session.startTime) }}
                          </div>
                          <div class="session-duration">
                            <strong>Thời gian:</strong> {{ formatDuration(session.elapsedTime) }} /
                            {{ formatDuration(session.plannedDuration) }}
                          </div>
                          <div class="session-progress">
                            <div class="progress-bar">
                              <div
                                class="progress-fill"
                                :style="{
                                  width: session.completionPercentage + '%',
                                  backgroundColor: getStatusColor(session.status),
                                }"
                              ></div>
                            </div>
                            <span class="progress-text">{{ session.completionPercentage }}%</span>
                          </div>
                        </div>
                      </div>
                      <button class="btn-delete" @click="deleteSession(session.id)" title="Xóa">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div v-else class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>Chưa có phiên làm việc nào</p>
                    <p class="empty-hint">Bắt đầu một phiên Pomodoro để theo dõi tiến độ!</p>
                  </div>
                </div>
              </transition>
            </div>
            <!-- end content-body -->
          </div>
          <!-- end pomodoro-content -->
        </div>
        <!-- end right-panel -->
      </div>
      <!-- end bubble-content-wrapper -->
    </transition>
  </div>

  <!-- Fullscreen Layer (Teleported to body) -->
  <Teleport to="body">
    <transition name="fullscreen-fade">
      <div v-if="isFullscreen" class="fullscreen-overlay" @mousedown.stop @touchstart.stop>
        <div class="fullscreen-content">
          <!-- Exit Fullscreen Button -->
          <button class="btn-exit-fullscreen" @click="toggleFullscreen" title="Thoát toàn màn hình">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
              />
            </svg>
            <span>Thoát</span>
          </button>

          <!-- Left Panel: TodoList -->
          <div class="fullscreen-left-panel">
            <TodoList
              :tasks="tasks"
              :current-session-id="currentSession?.id"
              :is-fullscreen="true"
              @update:tasks="tasks = $event"
              @task-completed="handleTaskCompleted"
            />
          </div>

          <!-- Right Panel: Pomodoro -->
          <div class="fullscreen-right-panel">
            <div class="pomodoro-content">
              <!-- Status Badge (Floating) -->
              <div class="status-badge-floating" :class="statusClass">
                {{ statusText }}
              </div>

              <div class="content-body">
                <!-- Timer Display -->
                <div class="timer-display">
                  <div class="time-circle time-circle-large">
                    <svg class="timer-progress" viewBox="0 0 200 200">
                      <defs>
                        <linearGradient id="timer-gradient-fs" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color: #667eea; stop-opacity: 1" />
                          <stop offset="100%" style="stop-color: #764ba2; stop-opacity: 1" />
                        </linearGradient>
                      </defs>

                      <circle class="timer-progress-bg" cx="100" cy="100" r="90" />
                      <circle
                        class="timer-progress-fill"
                        cx="100"
                        cy="100"
                        r="90"
                        :style="timerProgressStyle"
                        :class="{ completed: timerStatus === 'completed' }"
                        stroke="url(#timer-gradient-fs)"
                      />
                    </svg>
                    <div class="time-text time-text-large">
                      {{ formatTime(remainingTime) }}
                    </div>
                  </div>
                </div>

                <!-- Time Settings (only show when idle) -->
                <div class="time-settings time-settings-large" v-if="timerStatus === 'idle'">
                  <div class="setting-group">
                    <label>Giờ</label>
                    <input
                      type="number"
                      v-model.number="hours"
                      min="0"
                      max="23"
                      @input="updateTotalTime"
                    />
                  </div>
                  <div class="setting-group">
                    <label>Phút</label>
                    <input
                      type="number"
                      v-model.number="minutes"
                      min="0"
                      max="59"
                      @input="updateTotalTime"
                    />
                  </div>
                  <div class="setting-group">
                    <label>Giây</label>
                    <input
                      type="number"
                      v-model.number="seconds"
                      min="0"
                      max="59"
                      @input="updateTotalTime"
                    />
                  </div>
                </div>

                <!-- Control Buttons -->
                <div class="controls controls-large">
                  <button
                    v-if="timerStatus === 'idle'"
                    class="btn btn-primary btn-large"
                    @click="startTimer"
                    :disabled="totalTime === 0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Bắt đầu
                  </button>

                  <button
                    v-if="timerStatus === 'running'"
                    class="btn btn-warning btn-large"
                    @click="pauseTimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Tạm dừng
                  </button>

                  <button
                    v-if="timerStatus === 'paused'"
                    class="btn btn-primary btn-large"
                    @click="resumeTimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Tiếp tục
                  </button>

                  <button
                    v-if="timerStatus !== 'idle'"
                    class="btn btn-secondary btn-large"
                    @click="resetTimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <polyline points="23 20 23 14 17 14" />
                      <path
                        d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                      />
                    </svg>
                    Đặt lại
                  </button>

                  <button
                    v-if="timerStatus === 'completed'"
                    class="btn btn-success btn-large"
                    @click="resetTimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Hoàn thành
                  </button>
                </div>

                <!-- Break Button Section -->
                <div class="break-section break-section-large" v-if="timerStatus === 'idle'">
                  <button
                    class="btn-break btn-break-large"
                    @click="handleStartBreak"
                    title="Bắt đầu nghỉ ngơi 5 phút"
                  >
                    <span>Relaxxx</span>
                  </button>
                </div>

                <!-- Focus Mode Info -->
                <div class="focus-mode-info" v-if="isFocusMode">
                  <div class="focus-icon">🎯</div>
                  <p>Chế độ tập trung đang bật</p>
                </div>

                <!-- History Toggle Button -->
                <div class="history-toggle">
                  <button class="btn btn-secondary" @click="showHistory = !showHistory">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {{ showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử' }}
                    <span class="badge" v-if="sessions.length > 0">{{ sessions.length }}</span>
                  </button>
                </div>

                <!-- Session History -->
                <transition name="slide">
                  <div v-if="showHistory" class="session-history">
                    <div class="history-header">
                      <h4>📊 Lịch sử phiên làm việc</h4>
                      <button
                        v-if="sessions.length > 0"
                        class="btn-clear"
                        @click="clearAllSessions"
                        title="Xóa tất cả"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          />
                        </svg>
                      </button>
                    </div>

                    <div class="stats-summary" v-if="sessions.length > 0">
                      <div class="stat-item">
                        <div class="stat-value">
                          {{ sessions.filter((s) => s.status === 'completed').length }}
                        </div>
                        <div class="stat-label">Hoàn thành</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ sessions.length }}</div>
                        <div class="stat-label">Tổng phiên</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">
                          {{
                            Math.round(
                              (sessions.filter((s) => s.status === 'completed').length /
                                sessions.length) *
                                100,
                            ) || 0
                          }}%
                        </div>
                        <div class="stat-label">Tỷ lệ</div>
                      </div>
                    </div>

                    <div class="session-list" v-if="sessions.length > 0">
                      <div
                        v-for="session in sessions"
                        :key="session.id"
                        class="session-item"
                        :class="`status-${session.status}`"
                      >
                        <div class="session-main">
                          <div
                            class="session-status"
                            :style="{ backgroundColor: getStatusColor(session.status) }"
                          >
                            {{ getStatusText(session.status) }}
                          </div>
                          <div class="session-info">
                            <div class="session-time">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {{ formatDate(session.startTime) }}
                            </div>
                            <div class="session-duration">
                              <strong>Thời gian:</strong>
                              {{ formatDuration(session.elapsedTime) }} /
                              {{ formatDuration(session.plannedDuration) }}
                            </div>
                            <div class="session-progress">
                              <div class="progress-bar">
                                <div
                                  class="progress-fill"
                                  :style="{
                                    width: session.completionPercentage + '%',
                                    backgroundColor: getStatusColor(session.status),
                                  }"
                                ></div>
                              </div>
                              <span class="progress-text">{{ session.completionPercentage }}%</span>
                            </div>
                          </div>
                        </div>
                        <button class="btn-delete" @click="deleteSession(session.id)" title="Xóa">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div v-else class="empty-state">
                      <div class="empty-icon">📭</div>
                      <p>Chưa có phiên làm việc nào</p>
                      <p class="empty-hint">Bắt đầu một phiên Pomodoro để theo dõi tiến độ!</p>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import TodoList from './TodoList.vue'

// Dragging refs
const bubbleRef = ref(null)
const isDragging = ref(false)
const isExpanded = ref(false)
const position = ref({ x: 0, y: 0 })
const dragStart = ref({ x: 0, y: 0 })
const initialPosition = ref({ x: 0, y: 0 })

// Timer refs
const hours = ref(0)
const minutes = ref(25)
const seconds = ref(0)
const totalTime = ref(25 * 60) // in seconds
const remainingTime = ref(25 * 60)
const timerStatus = ref('idle') // 'idle', 'running', 'paused', 'completed'
const timerInterval = ref(null)
const isFocusMode = ref(false)
const isFullscreen = ref(false)

// Session history
const sessions = ref([]) // Array of completed/ongoing sessions
const currentSession = ref(null) // Current session being tracked
const showHistory = ref(false) // Toggle history view

// TodoList state
const tasks = ref([]) // Array of tasks
const newTask = ref({
  title: '',
  difficulty: 1, // 1-5 (fire icons)
  satisfaction: 0, // 0-5 (stars) - set after completion
  note: '',
  subtasks: [],
  completed: false,
  linkedSessionId: null,
})
const editingTaskId = ref(null)
const showSubtasks = ref({}) // Track which tasks show subtasks

// Audio for completion
const completionSound = ref(null)

// Computed style for bubble position
const bubbleStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
}))

// Progress ring style (small ring on bubble - empties as time passes)
const progressRingStyle = computed(() => {
  const radius = 27
  const circumference = 2 * Math.PI * radius

  // When idle or completed, show full ring. When running, show remaining time
  let progress
  if (timerStatus.value === 'idle') {
    progress = 1 // Full ring when idle
  } else if (timerStatus.value === 'completed') {
    progress = 0 // Empty ring when completed
  } else {
    // Show remaining time as progress (decreases from 1 to 0)
    progress = totalTime.value > 0 ? remainingTime.value / totalTime.value : 0
  }

  // Offset: 0 = full ring, circumference = empty ring
  const offset = circumference * (1 - progress)

  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset,
  }
})

// Timer progress style (large circle - empties as time passes)
const timerProgressStyle = computed(() => {
  const radius = 90
  const circumference = 2 * Math.PI * radius

  // When idle or completed, show full ring. When running, show remaining time
  let progress
  if (timerStatus.value === 'idle') {
    progress = 1 // Full ring when idle
  } else if (timerStatus.value === 'completed') {
    progress = 0 // Empty ring when completed (will show green)
  } else {
    // Show remaining time as progress (decreases from 1 to 0)
    progress = totalTime.value > 0 ? remainingTime.value / totalTime.value : 0
  }

  // Offset: 0 = full ring, circumference = empty ring
  const offset = circumference * (1 - progress)

  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset,
  }
})

// Status class
const statusClass = computed(() => {
  switch (timerStatus.value) {
    case 'running':
      return 'status-running'
    case 'paused':
      return 'status-paused'
    case 'completed':
      return 'status-completed'
    default:
      return 'status-idle'
  }
})

// Status text
const statusText = computed(() => {
  switch (timerStatus.value) {
    case 'running':
      return 'Đang chạy'
    case 'paused':
      return 'Tạm dừng'
    case 'completed':
      return 'Hoàn thành'
    default:
      return 'Sẵn sàng'
  }
})

// Format time display
const formatTime = (timeInSeconds) => {
  const h = Math.floor(timeInSeconds / 3600)
  const m = Math.floor((timeInSeconds % 3600) / 60)
  const s = timeInSeconds % 60

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Update total time when settings change
const updateTotalTime = () => {
  totalTime.value = hours.value * 3600 + minutes.value * 60 + seconds.value
  remainingTime.value = totalTime.value
}

// Start timer
const startTimer = () => {
  if (totalTime.value === 0) return

  timerStatus.value = 'running'
  isFocusMode.value = true

  // Create new session
  currentSession.value = {
    id: Date.now(),
    startTime: new Date(),
    plannedDuration: totalTime.value,
    elapsedTime: 0,
    status: 'running',
    pausedAt: null,
  }

  // Apply focus mode to body
  document.body.classList.add('pomodoro-focus-mode')

  timerInterval.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
      if (currentSession.value) {
        currentSession.value.elapsedTime++
      }
    } else {
      completeTimer()
    }
  }, 1000)
}

// Pause timer
const pauseTimer = () => {
  timerStatus.value = 'paused'
  isFocusMode.value = false
  document.body.classList.remove('pomodoro-focus-mode')

  if (currentSession.value) {
    currentSession.value.status = 'paused'
    currentSession.value.pausedAt = new Date()
  }

  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// Resume timer
const resumeTimer = () => {
  timerStatus.value = 'running'
  isFocusMode.value = true
  document.body.classList.add('pomodoro-focus-mode')

  if (currentSession.value) {
    currentSession.value.status = 'running'
    currentSession.value.pausedAt = null
  }

  timerInterval.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
      if (currentSession.value) {
        currentSession.value.elapsedTime++
      }
    } else {
      completeTimer()
    }
  }, 1000)
}

// Complete timer
const completeTimer = () => {
  timerStatus.value = 'completed'
  isFocusMode.value = false
  document.body.classList.remove('pomodoro-focus-mode')

  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  // Save completed session
  if (currentSession.value) {
    currentSession.value.status = 'completed'
    currentSession.value.endTime = new Date()
    currentSession.value.completionPercentage = 100
    sessions.value.unshift({ ...currentSession.value })
    saveSessionsToLocalStorage()
  }

  // Play completion sound
  playCompletionSound()

  // Show notification if supported
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pomodoro hoàn thành! 🎉', {
      body: 'Bạn đã hoàn thành phiên làm việc!',
      icon: '/favicon.ico',
    })
  }
}

// Reset timer
const resetTimer = () => {
  const wasRunning = timerStatus.value === 'running' || timerStatus.value === 'paused'

  timerStatus.value = 'idle'
  isFocusMode.value = false
  document.body.classList.remove('pomodoro-focus-mode')

  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  // Save incomplete session if it was running
  if (wasRunning && currentSession.value) {
    currentSession.value.status = 'cancelled'
    currentSession.value.endTime = new Date()
    currentSession.value.completionPercentage = Math.round(
      (currentSession.value.elapsedTime / currentSession.value.plannedDuration) * 100,
    )
    sessions.value.unshift({ ...currentSession.value })
    saveSessionsToLocalStorage()
  }

  currentSession.value = null
  remainingTime.value = totalTime.value
}

// Play completion sound - Bird chirping (tweet tweet!)
const playCompletionSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Function to create a single bird chirp with frequency modulation
    const playChirp = (startTime, baseFreq, duration, pattern = 'up') => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Add vibrato for more realistic bird sound
      const vibrato = audioContext.createOscillator()
      const vibratoGain = audioContext.createGain()

      vibrato.frequency.value = 8 // Vibrato speed
      vibratoGain.gain.value = 15 // Vibrato depth

      vibrato.connect(vibratoGain)
      vibratoGain.connect(oscillator.frequency)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Use sine wave for smooth bird-like tone
      oscillator.type = 'sine'
      vibrato.type = 'sine'

      // Frequency modulation (pitch changes) - creates the "chirp" effect
      if (pattern === 'up') {
        // Rising chirp: tweet going up
        oscillator.frequency.setValueAtTime(baseFreq, startTime)
        oscillator.frequency.exponentialRampToValueAtTime(
          baseFreq * 1.8,
          startTime + duration * 0.4,
        )
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + duration)
      } else if (pattern === 'down') {
        // Falling chirp: tweet going down
        oscillator.frequency.setValueAtTime(baseFreq * 1.6, startTime)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq, startTime + duration)
      } else if (pattern === 'warble') {
        // Warbling chirp: tweet with variation
        oscillator.frequency.setValueAtTime(baseFreq, startTime)
        oscillator.frequency.exponentialRampToValueAtTime(
          baseFreq * 1.4,
          startTime + duration * 0.3,
        )
        oscillator.frequency.exponentialRampToValueAtTime(
          baseFreq * 1.2,
          startTime + duration * 0.6,
        )
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, startTime + duration)
      }

      // Quick attack and decay (like real bird chirps)
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01) // Very quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration) // Quick decay

      // Start oscillators
      oscillator.start(startTime)
      vibrato.start(startTime)

      // Stop oscillators
      oscillator.stop(startTime + duration)
      vibrato.stop(startTime + duration)
    }

    // Create a bird song sequence: multiple chirps with different patterns
    const now = audioContext.currentTime

    // First bird: Happy chirping sequence
    playChirp(now, 2000, 0.12, 'up') // Tweet!
    playChirp(now + 0.15, 2200, 0.1, 'up') // Tweet!
    playChirp(now + 0.28, 1800, 0.15, 'warble') // Twee-dle!

    // Second bird responds (slightly different pitch)
    playChirp(now + 0.5, 2400, 0.11, 'down') // Chirp!
    playChirp(now + 0.64, 2600, 0.13, 'warble') // Chirp-chirp!

    // Final happy chirp
    playChirp(now + 0.85, 2800, 0.18, 'up') // Tweeet!
  } catch (error) {
    console.log('Could not play sound:', error)
  }
}

// Session management functions
const saveSessionsToLocalStorage = () => {
  try {
    localStorage.setItem('pomodoro-sessions', JSON.stringify(sessions.value))
  } catch (error) {
    console.error('Error saving sessions:', error)
  }
}

const loadSessionsFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('pomodoro-sessions')
    if (saved) {
      sessions.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading sessions:', error)
  }
}

const deleteSession = (sessionId) => {
  sessions.value = sessions.value.filter((s) => s.id !== sessionId)
  saveSessionsToLocalStorage()
}

const clearAllSessions = () => {
  if (confirm('Bạn có chắc muốn xóa tất cả lịch sử?')) {
    sessions.value = []
    saveSessionsToLocalStorage()
  }
}

const formatDate = (date) => {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return `Hôm nay ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (d.toDateString() === yesterday.toDateString()) {
    return `Hôm qua ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}h ${m}p ${s}s`
  } else if (m > 0) {
    return `${m}p ${s}s`
  }
  return `${s}s`
}

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return '#4ade80'
    case 'cancelled':
      return '#f59e0b'
    case 'running':
      return '#667eea'
    case 'paused':
      return '#fbbf24'
    default:
      return '#9ca3af'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Hoàn thành'
    case 'cancelled':
      return 'Đã hủy'
    case 'running':
      return 'Đang chạy'
    case 'paused':
      return 'Tạm dừng'
    default:
      return 'Không rõ'
  }
}

// TodoList management
const saveTasksToLocalStorage = () => {
  try {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks.value))
  } catch (error) {
    console.error('Error saving tasks:', error)
  }
}

const loadTasksFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('pomodoro-tasks')
    if (saved) {
      tasks.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading tasks:', error)
  }
}

const handleTaskCompleted = (task) => {
  // Play celebration effect
  playTaskCompletionEffect()
}

const handleStartBreak = () => {
  // Set timer to 5 minutes for Pomodoro break
  hours.value = 0
  minutes.value = 5
  seconds.value = 0
  updateTotalTime()

  // Auto-start the break timer
  if (timerStatus.value === 'idle') {
    startTimer()
  }
}

const playTaskCompletionEffect = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Play success chime
    const playChime = (freq, startTime) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()

      osc.connect(gain)
      gain.connect(audioContext.destination)

      osc.frequency.value = freq
      osc.type = 'sine'

      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

      osc.start(startTime)
      osc.stop(startTime + 0.5)
    }

    const now = audioContext.currentTime
    playChime(523, now) // C
    playChime(659, now + 0.1) // E
    playChime(784, now + 0.2) // G
  } catch (error) {
    console.log('Could not play sound:', error)
  }
}

// Watch tasks and save to localStorage
watch(
  tasks,
  () => {
    saveTasksToLocalStorage()
  },
  { deep: true },
)

// Toggle expand/collapse
const toggleExpand = (event) => {
  if (!isDragging.value) {
    isExpanded.value = !isExpanded.value
  }
}

// Toggle fullscreen mode
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  if (isFullscreen.value) {
    // Add fullscreen class to body
    document.body.classList.add('pomodoro-fullscreen-mode')
  } else {
    // Remove fullscreen class from body
    document.body.classList.remove('pomodoro-fullscreen-mode')
  }
}

// Start dragging
const startDrag = (event) => {
  event.preventDefault()

  const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
  const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY

  dragStart.value = { x: clientX, y: clientY }
  initialPosition.value = { ...position.value }

  if (event.type.includes('touch')) {
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
  } else {
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }
}

// During drag
const onDrag = (event) => {
  isDragging.value = true

  const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
  const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY

  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y

  let newX = initialPosition.value.x + deltaX
  let newY = initialPosition.value.y + deltaY

  const bubble = bubbleRef.value
  if (bubble) {
    const rect = bubble.getBoundingClientRect()
    const bubbleWidth = rect.width
    const bubbleHeight = rect.height

    const maxX = window.innerWidth - bubbleWidth
    const maxY = window.innerHeight - bubbleHeight

    newX = Math.max(0, Math.min(newX, maxX))
    newY = Math.max(0, Math.min(newY, maxY))
  }

  position.value = { x: newX, y: newY }
}

// Stop dragging
const stopDrag = () => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)

  setTimeout(() => {
    isDragging.value = false
  }, 50)
}

// Initialize position
const initializePosition = () => {
  const bubble = bubbleRef.value
  if (bubble) {
    const rect = bubble.getBoundingClientRect()
    position.value = {
      x: window.innerWidth - rect.width - 20,
      y: window.innerHeight - rect.height - 20,
    }
  }
}

// Handle window resize
const handleResize = () => {
  const bubble = bubbleRef.value
  if (bubble) {
    const rect = bubble.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width
    const maxY = window.innerHeight - rect.height

    position.value = {
      x: Math.max(0, Math.min(position.value.x, maxX)),
      y: Math.max(0, Math.min(position.value.y, maxY)),
    }
  }
}

// Request notification permission
const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// Lifecycle hooks
onMounted(() => {
  initializePosition()
  window.addEventListener('resize', handleResize)
  requestNotificationPermission()
  updateTotalTime()
  loadSessionsFromLocalStorage()
  loadTasksFromLocalStorage()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopDrag()

  // Clean up timer
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }

  // Remove focus mode
  document.body.classList.remove('pomodoro-focus-mode')
  document.body.classList.remove('pomodoro-fullscreen-mode')
})
</script>

<style scoped>
.draggable-bubble {
  position: fixed;
  z-index: 9999;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  top: 0;
  left: 0;
  will-change: transform;
}

.bubble-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: visible;
}

.is-running .bubble-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 20px rgba(245, 87, 108, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.is-focus-mode .bubble-button {
  box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.7);
  animation: pulse-focus 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes pulse-focus {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(245, 87, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 87, 108, 0);
  }
}

.bubble-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.bubble-button:hover::before {
  opacity: 1;
}

.bubble-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
}

.is-dragging .bubble-button {
  cursor: grabbing;
  transform: scale(0.95);
  box-shadow: 0 8px 40px rgba(102, 126, 234, 0.5);
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(-90deg);
}

.progress-ring-circle-fill {
  /* Linear transition for smooth, consistent fill animation */
  transition:
    stroke-dashoffset 1s linear,
    stroke 0.3s ease;
}

.bubble-icon {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.is-expanded .bubble-icon {
  transform: rotate(90deg);
}

.bubble-time {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}

/* Bubble Content Wrapper with Side-by-Side Layout */
.bubble-content-wrapper {
  position: absolute;
  bottom: 70px;
  right: 0;
  min-width: 900px;
  max-width: 1200px;
  width: auto;
  max-height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  cursor: default;
  display: flex;
  flex-direction: row;
}

/* Left Panel: TodoList (Fixed Width - Increased 50%) */
.left-panel {
  width: 540px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #e5e7eb;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  overflow-y: auto;
}

/* Right Panel: Pomodoro (Flexible Width) */
.right-panel {
  flex: 1;
  min-width: 360px;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
}

/* Pomodoro Content */
.pomodoro-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

/* Floating Status Badge */
.status-badge-floating {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-header h3 {
  margin: 0;
  font-size: 20px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Floating badge specific styles */
.status-badge-floating.status-idle {
  background: #e5e7eb;
  color: #6b7280;
}

.status-badge-floating.status-running {
  background: #4ade80;
  color: white;
  animation: badge-pulse 2s ease-in-out infinite;
}

.status-badge-floating.status-paused {
  background: #fbbf24;
  color: #92400e;
}

.status-badge-floating.status-completed {
  background: #10b981;
  color: white;
}

/* Old badge styles for compatibility */
.status-idle {
  background: rgba(255, 255, 255, 0.2);
}

.status-running {
  background: rgba(74, 222, 128, 0.3);
  animation: badge-pulse 2s ease-in-out infinite;
}

.status-paused {
  background: rgba(251, 191, 36, 0.3);
}

.status-completed {
  background: rgba(74, 222, 128, 0.5);
}

@keyframes badge-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.content-body {
  padding: 24px;
  max-height: 520px;
  overflow-y: auto;
}

.timer-display {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.time-circle {
  position: relative;
  width: 200px;
  height: 200px;
}

.timer-progress {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-progress-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 8;
}

.timer-progress-fill {
  fill: none;
  stroke: url(#timer-gradient);
  stroke-width: 8;
  stroke-linecap: round;
  /* Linear transition for smooth, consistent fill animation */
  transition: stroke-dashoffset 1s linear;
}

.timer-progress-fill.completed {
  stroke: #4ade80;
}

.time-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: 700;
  color: #667eea;
  font-variant-numeric: tabular-nums;
}

.time-settings {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-group input {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.setting-group input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.setting-group input::-webkit-inner-spin-button,
.setting-group input::-webkit-outer-spin-button {
  opacity: 1;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-warning {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.btn-success {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 222, 128, 0.4);
}

.focus-mode-info {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.focus-icon {
  font-size: 24px;
}

.focus-mode-info p {
  margin: 0;
  color: #92400e;
  font-weight: 600;
  font-size: 14px;
}

/* History Toggle */
.history-toggle {
  margin-top: 16px;
}

.history-toggle .btn {
  width: 100%;
  position: relative;
}

.badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

/* Session History */
.session-history {
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-header h4 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.btn-clear {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-clear:hover {
  background: #fee2e2;
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Session List */
.session-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s ease;
}

.session-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.session-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.session-duration {
  font-size: 13px;
  color: #374151;
}

.session-duration strong {
  color: #1f2937;
}

.session-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  min-width: 35px;
  text-align: right;
}

.btn-delete {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 8px 0;
  color: #6b7280;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom right;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Scrollbar styling */
.content-body::-webkit-scrollbar {
  width: 6px;
}

.content-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bubble-content {
    background: #1e1e1e;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  /* .time-text {
    color: #e5e7eb;
  } */

  .timer-progress-bg {
    stroke: #374151;
  }

  .setting-group label {
    color: #9ca3af;
  }

  .setting-group input {
    background: #374151;
    border-color: #4b5563;
    color: #e5e7eb;
  }

  .setting-group input:focus {
    background: #4b5563;
    border-color: #667eea;
  }

  .btn-secondary {
    background: #374151;
    color: #e5e7eb;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .content-body::-webkit-scrollbar-track {
    background: #2a2a2a;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .bubble-content-wrapper {
    flex-direction: column;
    width: calc(100vw - 40px);
    max-width: 360px;
    min-width: 320px;
  }

  .left-panel {
    width: 100%;
    border-right: none;
    border-bottom: 2px solid #e5e7eb;
    max-height: 250px;
  }

  .right-panel {
    width: 100%;
    min-width: auto;
  }

  .panel-body {
    max-height: 200px;
  }
}
</style>

<style>
/* Global focus mode styles */
body.pomodoro-focus-mode {
  position: relative;
}

body.pomodoro-focus-mode::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 9998;
  pointer-events: none;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Global fullscreen mode styles */
body.pomodoro-fullscreen-mode {
  overflow: hidden;
}
</style>

<style scoped>
/* Fullscreen Toggle Button */
.btn-fullscreen {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #667eea;
}

.btn-fullscreen:hover {
  background: #f0f9ff;
  border-color: #667eea;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-fullscreen:active {
  transform: scale(0.95);
}
</style>

<!-- Global styles for fullscreen (not scoped because Teleport renders outside component) -->
<style>
/* Fullscreen Overlay - Teleported to body */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  z-index: 99999;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
}

.fullscreen-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  background: white;
  position: relative;
}

/* Exit Fullscreen Button */
.btn-exit-fullscreen {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-exit-fullscreen:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-exit-fullscreen:active {
  transform: scale(0.95);
}

/* Fullscreen Left Panel */
.fullscreen-left-panel {
  width: 45%;
  height: 100%;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-right: 2px solid #e5e7eb;
  overflow-y: auto;
  padding-top: 80px;
}

/* Fullscreen Right Panel */
.fullscreen-right-panel {
  width: 55%;
  height: 100%;
  background: white;
  overflow-y: auto;
  padding-top: 80px;
  position: relative;
}

.fullscreen-right-panel .pomodoro-content {
  padding: 30px 40px;
  height: 100%;
}

.fullscreen-right-panel .content-body {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

/* Larger elements in fullscreen */
.time-circle-large {
  width: 280px;
  height: 280px;
}

.time-text-large {
  font-size: 48px !important;
}

.time-settings-large {
  gap: 20px;
}

.time-settings-large .setting-group input {
  padding: 16px;
  font-size: 20px;
}

.controls-large {
  gap: 16px;
}

.btn-large {
  padding: 18px 28px;
  font-size: 16px;
}

/* Fullscreen Fade Transition */
.fullscreen-fade-enter-active,
.fullscreen-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fullscreen-fade-enter-from,
.fullscreen-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fullscreen-fade-enter-to,
.fullscreen-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Fullscreen responsive */
@media (max-width: 1200px) {
  .fullscreen-left-panel {
    width: 40%;
  }

  .fullscreen-right-panel {
    width: 60%;
  }

  .time-circle-large {
    width: 240px;
    height: 240px;
  }

  .time-text-large {
    font-size: 40px !important;
  }
}

@media (max-width: 768px) {
  .fullscreen-content {
    flex-direction: column;
  }

  .fullscreen-left-panel {
    width: 100%;
    height: 45%;
    border-right: none;
    border-bottom: 2px solid #e5e7eb;
    padding-top: 70px;
  }

  .fullscreen-right-panel {
    width: 100%;
    height: 55%;
    padding-top: 20px;
  }

  .btn-exit-fullscreen {
    top: 12px;
    left: 12px;
    padding: 10px 16px;
    font-size: 13px;
  }

  .time-circle-large {
    width: 180px;
    height: 180px;
  }

  .time-text-large {
    font-size: 32px !important;
  }

  .fullscreen-right-panel .pomodoro-content {
    padding: 20px;
  }
}

/* Break Button Section */
.break-section {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 16px;
  border: 2px solid #fbbf24;
  text-align: center;
}

.btn-break {
  width: 100%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-break:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.btn-break:active {
  transform: translateY(0);
}

.btn-break svg {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.break-hint {
  margin: 12px 0 0 0;
  font-size: 12px;
  color: #92400e;
  font-style: italic;
}

/* Larger break button for fullscreen */
.break-section-large {
  margin-top: 20px;
  padding: 20px;
}

.btn-break-large {
  padding: 18px 28px;
  font-size: 17px;
}

.btn-break-large svg {
  width: 22px;
  height: 22px;
}
</style>
