<script setup>
import { ref, onMounted, computed } from 'vue'

const API_BASE = '/api'

const messages = ref([])
const loading = ref(false)

const form = ref({
  nickname: '',
  emailOrQq: '',
  content: '',
  isSecret: false,
  isNotice: true,
  isMarkdown: true
})
const replyTarget = ref(null)
const submitting = ref(false)
const msgTextareaRef = ref(null)

const load = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/messages`)
    const result = await res.json()
    if (result.success) {
      messages.value = result.data ?? []
    }
  } catch {
    messages.value = []
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.nickname.trim()) {
    alert('请输入昵称')
    return
  }
  if (!form.value.content.trim()) {
    alert('请输入内容')
    return
  }
  
  submitting.value = true
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: form.value.content,
        root_id: replyTarget.value?.root_id || replyTarget.value?.id || null,
        parent_id: replyTarget.value?.id || null,
        parentNickname: replyTarget.value?.nickname || null,
        nickname: form.value.nickname,
        emailOrQq: form.value.emailOrQq,
        isSecret: form.value.isSecret ? 1 : 0,
        isNotice: form.value.isNotice ? 1 : 0,
        isMarkdown: form.value.isMarkdown ? 1 : 0
      })
    })
    
    const result = await res.json()
    
    if (result.success) {
      resetForm()
      await load()
    } else {
      alert(result.error || '留言失败')
    }
  } catch {
    alert('留言失败')
  } finally {
    submitting.value = false
  }
}

const startReply = (msg) => {
  replyTarget.value = msg
  form.value.content = ''
  document.querySelector('.msg-form')?.scrollIntoView({ behavior: 'smooth' })
}

const resetForm = () => {
  replyTarget.value = null
  form.value.content = ''
  form.value.isSecret = false
  form.value.isNotice = true
  form.value.isMarkdown = true
}

const getAvatarUrl = (msg) => {
  const eq = msg.email_or_qq || msg.emailOrQq
  if (!eq) return ''
  if (/^\d{5,11}$/.test(eq)) return `https://q1.qlogo.cn/g?b=qq&nk=${eq}&s=640`
  const m = eq.match(/^(\d{5,11})@qq\.com$/i)
  if (m) return `https://q1.qlogo.cn/g?b=qq&nk=${m[1]}&s=640`
  return ''
}

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?')

const fmtDate = (d) => {
  if (!d) return ''
  return d.slice(0, 16).replace('T', ' ')
}

const totalCount = computed(() => {
  let n = 0
  const count = (list) => {
    list.forEach((m) => {
      n++
      if (m.children?.length) count(m.children)
    })
  }
  count(messages.value)
  return n
})

onMounted(() => {
  load()
})
</script>

<template>
  <div class="message-page">
    <div class="message-layout">
      <div class="message-inner">
        <div class="msg-form form-card">
          <h3 class="form-title">
            {{ replyTarget ? '回复留言' : '写留言' }}
          </h3>

          <div v-if="replyTarget" class="reply-tip">
            回复 <strong>{{ replyTarget.nickname }}</strong>
            <span class="cancel" @click="resetForm">&times;</span>
          </div>

          <textarea
            ref="msgTextareaRef"
            v-model="form.content"
            class="form-textarea"
            placeholder="写点什么..."
            rows="4"
          />
          <div class="form-row">
            <div class="input-with-icon">
              <input
                v-model="form.nickname"
                type="text"
                placeholder="昵称 *"
                class="form-input"
              />
            </div>
            <div class="input-with-icon">
              <input
                v-model="form.emailOrQq"
                type="text"
                placeholder="邮箱/QQ号"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-options">
            <label class="option-check">
              <input type="checkbox" v-model="form.isSecret" />
              悄悄话
            </label>
            <label class="option-check">
              <input type="checkbox" v-model="form.isNotice" />
              邮件提醒
            </label>
            <label class="option-check">
              <input type="checkbox" v-model="form.isMarkdown" />
              Markdown
            </label>
            <div class="form-actions">
              <button
                class="btn-submit"
                :disabled="submitting"
                @click="handleSubmit"
              >
                {{ replyTarget ? '回复' : '留言' }}
              </button>
            </div>
          </div>
        </div>

        <div class="msg-count">
          <span>共 {{ totalCount }} 条留言</span>
        </div>

        <div v-if="loading" class="placeholder">
          <div v-for="i in 3" :key="i" class="sk-line" />
        </div>

        <div v-else class="msg-list">
          <template v-for="msg in messages" :key="msg.id">
            <div class="msg-item-card">
              <div class="msg-avatar">
                <img
                  v-if="getAvatarUrl(msg)"
                  :src="getAvatarUrl(msg)"
                  class="msg-avatar-img"
                  loading="lazy"
                />
                <span v-else class="msg-avatar-letter">{{
                  getInitial(msg.nickname)
                }}</span>
              </div>
              <div class="msg-main">
                <div class="msg-head">
                  <span class="msg-nick">{{ msg.nickname }}</span>
                  <span v-if="msg.isApproved === 0" class="msg-pending"
                    >未审核</span
                  >
                  <span class="msg-date">{{ fmtDate(msg.created_at || msg.createTime) }}</span>
                </div>
                <div class="msg-body">{{ msg.content }}</div>
                <div class="msg-footer">
                  <div class="msg-actions">
                    <span class="act" @click="startReply(msg)">回复</span>
                  </div>
                </div>

                <div v-if="msg.children?.length" class="msg-children">
                  <div
                    v-for="child in msg.children"
                    :key="child.id"
                    class="msg-child"
                  >
                    <div class="msg-avatar msg-avatar-sm">
                      <img
                        v-if="getAvatarUrl(child)"
                        :src="getAvatarUrl(child)"
                        class="msg-avatar-img"
                        loading="lazy"
                      />
                      <span v-else class="msg-avatar-letter">{{
                        getInitial(child.nickname)
                      }}</span>
                    </div>
                    <div class="msg-main">
                      <div class="msg-head">
                        <span class="msg-nick">{{ child.nickname }}</span>
                        <span v-if="child.reply_name || child.parentNickname" class="reply-tag"
                          >回复 @{{ child.reply_name || child.parentNickname }}</span
                        >
                        <span v-if="child.isApproved === 0" class="msg-pending"
                          >未审核</span
                        >
                        <span class="msg-date">{{
                          fmtDate(child.created_at || child.createTime)
                        }}</span>
                      </div>
                      <div class="msg-body">{{ child.content }}</div>
                      <div class="msg-footer">
                        <div class="msg-actions">
                          <span class="act" @click="startReply(child)"
                            >回复</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <p v-if="!loading && !messages.length" class="empty">
          还没有留言，来写第一条吧
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-page {
  width: 100%;
}
.message-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.message-inner {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #ebeef5;
  padding: 20px 24px;
}
.form-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 14px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}
.reply-tip {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cancel {
  cursor: pointer;
  font-size: 16px;
  margin-left: auto;
  color: #909399;
}
.form-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.input-with-icon {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.form-input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  font-family: inherit;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: #303133;
}
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  background: #fff;
  box-sizing: border-box;
  margin-bottom: 8px;
}
.form-textarea:focus {
  border-color: #303133;
}
.form-options {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.option-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}
.option-check input[type='checkbox'] {
  accent-color: #303133;
}
.btn-submit {
  padding: 8px 24px;
  font-size: 13px;
  border: none;
  background: #303133;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  margin-left: auto;
  transition: background 0.15s;
}
.btn-submit:hover {
  background: #000;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.msg-count {
  font-size: 13px;
  color: #909399;
  padding: 0 4px;
}

.msg-item-card {
  display: flex;
  gap: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #ebeef5;
  padding: 18px 22px;
  margin-bottom: 12px;
}

.msg-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}
.msg-avatar-sm {
  width: 32px;
  height: 32px;
}
.msg-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ebeef5;
}
.msg-avatar-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e4e7ed;
  color: #606266;
  font-size: 16px;
  font-weight: 700;
  user-select: none;
}
.msg-avatar-sm .msg-avatar-letter {
  font-size: 13px;
}

.msg-main {
  flex: 1;
  min-width: 0;
}
.msg-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.msg-nick {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
}
.reply-tag {
  font-size: 12px;
  color: #9b59b6;
  background: rgba(155, 89, 182, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}
.msg-pending {
  font-size: 10px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
}
.msg-date {
  font-size: 12px;
  color: #c0c4cc;
  margin-left: auto;
  flex-shrink: 0;
}

.msg-body {
  font-size: 14px;
  color: #444;
  line-height: 1.7;
  margin-top: 6px;
}

.msg-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
.msg-actions {
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.15s;
}
.msg-item-card:hover .msg-actions,
.msg-child:hover > .msg-main > .msg-footer > .msg-actions {
  opacity: 1;
}
.act {
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  transition: color 0.15s;
}
.act:hover {
  color: #303133;
}

.msg-children {
  margin-top: 8px;
  padding-left: 4px;
  border-left: 2px solid #ebeef5;
}
.msg-child {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}
.msg-child + .msg-child {
  border-top: 1px dashed #ebeef5;
}

.placeholder {
  padding: 20px 0;
}
@keyframes sk-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.sk-line {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 12px;
  width: 60%;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.empty {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}

@media (max-width: 960px) {
  .message-layout {
    flex-direction: column;
  }
}
@media (max-width: 600px) {
  .form-card,
  .msg-item-card {
    padding: 14px 16px;
  }
  .form-row {
    flex-direction: column;
  }
  .msg-child {
    gap: 8px;
  }
}
</style>