<template>
  <div class="todo-container" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- Add Task Form -->
    <div class="add-task-form">
      <input
        v-model="localNewTask.title"
        type="text"
        placeholder="Thêm task mới..."
        class="task-input"
        @keyup.enter="addTask"
      />

      <!-- Difficulty Selector -->
      <div class="difficulty-selector">
        <label>🔥 Độ khó:</label>
        <div class="fire-icons">
          <span
            v-for="n in 5"
            :key="n"
            class="fire-icon"
            :class="{ active: n <= localNewTask.difficulty }"
            @click="localNewTask.difficulty = n"
          >
            🔥
          </span>
        </div>
      </div>

      <button class="btn btn-add" @click="addTask" :disabled="!localNewTask.title.trim()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Thêm Task
      </button>
    </div>

    <!-- Task List -->
    <div class="task-list" v-if="tasks.length > 0">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        :class="{
          completed: task.completed,
          editing: editingTaskId === task.id,
          'has-session': task.linkedSessionId,
        }"
      >
        <!-- Task Main -->
        <div class="task-main">
          <!-- Checkbox -->
          <div class="task-checkbox" @click="toggleTaskComplete(task.id)">
            <transition name="check">
              <svg
                v-if="task.completed"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </transition>
          </div>

          <!-- Task Content -->
          <div class="task-content">
            <div class="task-header">
              <input
                v-if="editingTaskId === task.id"
                v-model="task.title"
                class="task-edit-input"
                @blur="saveTask"
                @keyup.enter="saveTask"
                @keyup.esc="cancelEdit"
              />
              <h4 v-else @dblclick="startEdit(task.id)">{{ task.title }}</h4>

              <!-- Difficulty Display -->
              <div class="task-difficulty">
                <span v-for="n in task.difficulty" :key="n" class="fire-small">🔥</span>
              </div>
            </div>

            <!-- Satisfaction (only show when completed) -->
            <div v-if="task.completed" class="task-satisfaction">
              <label>⭐ Độ hài lòng:</label>
              <div class="star-icons">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="star-icon"
                  :class="{ active: n <= task.satisfaction }"
                  @click="updateSatisfaction(task.id, n)"
                >
                  ⭐
                </span>
              </div>
            </div>

            <!-- Note -->
            <div v-if="task.note" class="task-note">📝 {{ task.note }}</div>

            <!-- Session Link -->
            <div v-if="task.linkedSessionId" class="task-session-link">
              🍅 Đã liên kết với phiên làm việc
            </div>

            <!-- Subtasks Section -->
            <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks">
              <button class="subtask-toggle" @click="toggleSubtasks(task.id)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline
                    :points="showSubtasksMap[task.id] ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"
                  />
                </svg>
                {{ task.subtasks.length }} subtask{{ task.subtasks.length > 1 ? 's' : '' }}
              </button>

              <transition name="slide-down">
                <div v-if="showSubtasksMap[task.id]" class="subtask-list">
                  <div
                    v-for="(subtask, index) in task.subtasks"
                    :key="index"
                    class="subtask-item"
                    :class="{ completed: subtask.completed }"
                  >
                    <div class="subtask-checkbox" @click="toggleSubtaskComplete(task.id, index)">
                      <transition name="check">
                        <svg
                          v-if="subtask.completed"
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </transition>
                    </div>
                    <span class="subtask-title">{{ subtask.title }}</span>
                    <button class="btn-delete-subtask" @click="deleteSubtask(task.id, index)">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
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

                  <!-- Add Subtask Form -->
                  <div class="add-subtask">
                    <input
                      v-model="newSubtaskTitle[task.id]"
                      type="text"
                      placeholder="Thêm subtask..."
                      @keyup.enter="addSubtask(task.id)"
                    />
                    <button @click="addSubtask(task.id)" :disabled="!newSubtaskTitle[task.id]">
                      +
                    </button>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Show form when initialized but no subtasks yet -->
            <div v-else-if="showSubtasksMap[task.id]" class="subtasks">
              <div class="subtask-list">
                <!-- Add Subtask Form -->
                <div class="add-subtask">
                  <input
                    v-model="newSubtaskTitle[task.id]"
                    type="text"
                    placeholder="Thêm subtask đầu tiên..."
                    @keyup.enter="addSubtask(task.id)"
                    ref="subtaskInput"
                  />
                  <button @click="addSubtask(task.id)" :disabled="!newSubtaskTitle[task.id]">
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Add first subtask button -->
            <button v-else class="btn-add-subtask" @click="initializeSubtasks(task.id)">
              + Thêm subtask
            </button>
          </div>

          <!-- Task Actions -->
          <div class="task-actions">
            <!-- Link to current session -->
            <button
              v-if="currentSessionId && !task.linkedSessionId && !task.completed"
              class="btn-action"
              @click="linkTaskToSession(task.id)"
              title="Gắn với phiên hiện tại"
            >
              🍅
            </button>

            <!-- Add Note -->
            <button class="btn-action" @click="toggleNoteEdit(task.id)" title="Thêm ghi chú">
              📝
            </button>

            <!-- Delete -->
            <button class="btn-action btn-delete" @click="deleteTask(task.id)" title="Xóa">
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

        <!-- Note Editor -->
        <transition name="slide-down">
          <div v-if="editingNoteId === task.id" class="note-editor">
            <textarea v-model="task.note" placeholder="Thêm ghi chú..." @blur="saveNote"></textarea>
          </div>
        </transition>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-todo">
      <div class="empty-icon">✨</div>
      <p>Chưa có task nào</p>
      <p class="empty-hint">Thêm task đầu tiên để bắt đầu!</p>
    </div>

    <!-- Stats -->
    <div class="todo-stats" v-if="tasks.length > 0">
      <div class="stat">
        <span class="stat-value">{{ completedTasks }}</span>
        <span class="stat-label">Hoàn thành</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ tasks.length }}</span>
        <span class="stat-label">Tổng</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ completionRate }}%</span>
        <span class="stat-label">Tỷ lệ</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  currentSessionId: {
    type: Number,
    default: null,
  },
  isFullscreen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:tasks', 'task-completed', 'task-added', 'task-deleted'])

const localNewTask = ref({
  title: '',
  difficulty: 1,
  satisfaction: 0,
  note: '',
  subtasks: [],
  completed: false,
  linkedSessionId: null,
})

const editingTaskId = ref(null)
const editingNoteId = ref(null)
const showSubtasksMap = ref({})
const newSubtaskTitle = ref({})

// Computed
const completedTasks = computed(() => props.tasks.filter((t) => t.completed).length)
const completionRate = computed(() =>
  props.tasks.length > 0 ? Math.round((completedTasks.value / props.tasks.length) * 100) : 0,
)

// Methods
const addTask = () => {
  if (!localNewTask.value.title.trim()) return

  const newTaskObj = {
    id: Date.now(),
    title: localNewTask.value.title,
    difficulty: localNewTask.value.difficulty,
    satisfaction: 0,
    note: '',
    subtasks: [],
    completed: false,
    linkedSessionId: null,
    createdAt: new Date(),
  }

  const updatedTasks = [...props.tasks, newTaskObj]
  emit('update:tasks', updatedTasks)
  emit('task-added', newTaskObj)

  // Reset form
  localNewTask.value = {
    title: '',
    difficulty: 1,
    satisfaction: 0,
    note: '',
    subtasks: [],
    completed: false,
    linkedSessionId: null,
  }
}

const toggleTaskComplete = (taskId) => {
  const updatedTasks = props.tasks.map((task) => {
    if (task.id === taskId) {
      const wasCompleted = task.completed
      const updated = { ...task, completed: !task.completed }

      if (!wasCompleted) {
        // Task just completed - trigger celebration
        emit('task-completed', updated)
        playCompletionEffect()
      }

      return updated
    }
    return task
  })

  emit('update:tasks', updatedTasks)
}

const updateSatisfaction = (taskId, rating) => {
  const updatedTasks = props.tasks.map((task) =>
    task.id === taskId ? { ...task, satisfaction: rating } : task,
  )
  emit('update:tasks', updatedTasks)
}

const deleteTask = (taskId) => {
  if (confirm('Bạn có chắc muốn xóa task này?')) {
    const updatedTasks = props.tasks.filter((task) => task.id !== taskId)
    emit('update:tasks', updatedTasks)
    emit('task-deleted', taskId)
  }
}

const startEdit = (taskId) => {
  editingTaskId.value = taskId
}

const saveTask = () => {
  editingTaskId.value = null
  emit('update:tasks', [...props.tasks])
}

const cancelEdit = () => {
  editingTaskId.value = null
}

const toggleNoteEdit = (taskId) => {
  editingNoteId.value = editingNoteId.value === taskId ? null : taskId
}

const saveNote = () => {
  editingNoteId.value = null
  emit('update:tasks', [...props.tasks])
}

const linkTaskToSession = (taskId) => {
  const updatedTasks = props.tasks.map((task) =>
    task.id === taskId ? { ...task, linkedSessionId: props.currentSessionId } : task,
  )
  emit('update:tasks', updatedTasks)
}

const toggleSubtasks = (taskId) => {
  showSubtasksMap.value[taskId] = !showSubtasksMap.value[taskId]
}

const initializeSubtasks = (taskId) => {
  // Ensure task has subtasks array
  const updatedTasks = props.tasks.map((task) => {
    if (task.id === taskId && !task.subtasks) {
      return { ...task, subtasks: [] }
    }
    return task
  })

  emit('update:tasks', updatedTasks)
  showSubtasksMap.value[taskId] = true
}

const addSubtask = (taskId) => {
  const title = newSubtaskTitle.value[taskId]
  if (!title || !title.trim()) return

  const updatedTasks = props.tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        subtasks: [...(task.subtasks || []), { title, completed: false }],
      }
    }
    return task
  })

  emit('update:tasks', updatedTasks)
  newSubtaskTitle.value[taskId] = ''
  showSubtasksMap.value[taskId] = true
}

const toggleSubtaskComplete = (taskId, subtaskIndex) => {
  const updatedTasks = props.tasks.map((task) => {
    if (task.id === taskId) {
      const updatedSubtasks = task.subtasks.map((st, idx) =>
        idx === subtaskIndex ? { ...st, completed: !st.completed } : st,
      )
      return { ...task, subtasks: updatedSubtasks }
    }
    return task
  })

  emit('update:tasks', updatedTasks)
}

const deleteSubtask = (taskId, subtaskIndex) => {
  const updatedTasks = props.tasks.map((task) => {
    if (task.id === taskId) {
      const updatedSubtasks = task.subtasks.filter((_, idx) => idx !== subtaskIndex)
      return { ...task, subtasks: updatedSubtasks }
    }
    return task
  })

  emit('update:tasks', updatedTasks)
}

const playCompletionEffect = () => {
  // Trigger confetti or celebration animation
  console.log('🎉 Task completed!')
}
</script>

<style scoped>
.todo-container {
  padding: 20px;
}

/* Add Task Form */
.add-task-form {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 20px;
  border: 2px solid #bae6fd;
}

.task-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #7dd3fc;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  background: white;
}

.task-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.difficulty-selector {
  margin-bottom: 12px;
}

.difficulty-selector label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 8px;
}

.fire-icons {
  display: flex;
  gap: 8px;
}

.fire-icon {
  font-size: 20px;
  cursor: pointer;
  opacity: 0.3;
  transition: all 0.2s ease;
  filter: grayscale(100%);
}

.fire-icon.active {
  opacity: 1;
  filter: grayscale(0%);
  transform: scale(1.1);
}

.fire-icon:hover {
  transform: scale(1.2);
}

.btn-add {
  width: 100%;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.task-item {
  background: white;
  border: 2px solid #e0f2fe;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.task-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #0ea5e9, #8b5cf6, #ec4899);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.task-item:hover::before {
  opacity: 1;
}

.task-item.completed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #6ee7b7;
}

.task-item.completed::before {
  background: linear-gradient(90deg, #10b981, #059669);
  opacity: 1;
}

.task-item.has-session {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.task-main {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* Checkbox */
.task-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #0ea5e9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  background: white;
}

.task-checkbox:hover {
  border-color: #0284c7;
  transform: scale(1.1);
}

.task-item.completed .task-checkbox {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
}

.check-enter-active {
  animation: checkmark 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes checkmark {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Task Content */
.task-content {
  flex: 1;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.task-header h4 {
  margin: 0;
  font-size: 16px;
  color: #0c4a6e;
  flex: 1;
}

.task-item.completed .task-header h4 {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #0ea5e9;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

.task-difficulty {
  display: flex;
  gap: 2px;
}

.fire-small {
  font-size: 14px;
}

/* Satisfaction */
.task-satisfaction {
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-satisfaction label {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
}

.star-icons {
  display: flex;
  gap: 4px;
}

.star-icon {
  font-size: 16px;
  cursor: pointer;
  opacity: 0.3;
  filter: grayscale(100%);
  transition: all 0.2s ease;
}

.star-icon.active {
  opacity: 1;
  filter: grayscale(0%);
  transform: scale(1.1);
}

.star-icon:hover {
  transform: scale(1.2);
}

/* Note */
.task-note {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-left: 3px solid #0ea5e9;
  border-radius: 6px;
  font-size: 13px;
  color: #0c4a6e;
}

/* Session Link */
.task-session-link {
  margin-top: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 6px;
  font-size: 12px;
  color: #92400e;
  font-weight: 600;
  display: inline-block;
}

/* Subtasks */
.subtasks {
  margin-top: 12px;
}

.subtask-toggle {
  background: transparent;
  border: none;
  color: #0ea5e9;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.subtask-toggle:hover {
  background: #f0f9ff;
}

.subtask-list {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid #bae6fd;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 6px;
  background: #f0f9ff;
  border-radius: 8px;
}

.subtask-title {
  font-size: 13px;
  color: #0c4a6e;
}

.subtask-item.completed {
  opacity: 0.6;
}

.subtask-item.completed span {
  text-decoration: line-through;
}

.subtask-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #0ea5e9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  background: white;
}

.subtask-item.completed .subtask-checkbox {
  background: #0ea5e9;
}

.btn-delete-subtask {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  margin-left: auto;
  opacity: 0;
  transition: all 0.2s ease;
}

.subtask-item:hover .btn-delete-subtask {
  opacity: 1;
}

.btn-delete-subtask:hover {
  background: #fee2e2;
}

.add-subtask {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.add-subtask input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 13px;
}

.add-subtask button {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.add-subtask button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add-subtask {
  background: transparent;
  border: 1px dashed #bae6fd;
  color: #0ea5e9;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.btn-add-subtask:hover {
  background: #f0f9ff;
  border-color: #0ea5e9;
}

/* Task Actions */
.task-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-action {
  background: white;
  border: 1px solid #e0f2fe;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-action:hover {
  background: #f0f9ff;
  border-color: #0ea5e9;
  transform: scale(1.1);
}

.btn-action.btn-delete:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

/* Note Editor */
.note-editor {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #bae6fd;
}

.note-editor textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  font-size: 13px;
  min-height: 60px;
  resize: vertical;
}

.note-editor textarea:focus {
  outline: none;
  border-color: #0ea5e9;
}

/* Empty State */
.empty-todo {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-todo p {
  margin: 0 0 8px 0;
  color: #64748b;
  font-size: 16px;
}

.empty-hint {
  font-size: 14px;
  color: #94a3b8;
  font-style: italic;
}

/* Stats */
.todo-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  border: 2px solid #bae6fd;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #0ea5e9;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Slide Down Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Fullscreen mode styles */
.todo-container.is-fullscreen {
  padding: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.todo-container.is-fullscreen .task-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 24px;
}

.todo-container.is-fullscreen .add-task-form {
  margin-bottom: 24px;
}

.todo-container.is-fullscreen .task-item {
  padding: 20px;
}

.todo-container.is-fullscreen .task-header h4 {
  font-size: 18px;
}

.todo-container.is-fullscreen .todo-stats {
  margin-top: auto;
}
</style>
