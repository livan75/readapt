<script lang="ts" setup>
import { ref } from 'vue'
import type { Language } from '@readapt/settings'
import { useRouter } from 'vue-router'
import LanguageSelect from '@/shared/ui/LanguageSelect.vue'
import type { TextProfileId } from '@/entities/textPreferences'
import { useTemplatesByLanguage } from '@/entities/textSettingsTemplate'
import { TextProfileCreateFromTemplate } from '@/features/textProfileCreateFromTemplate'
import { useI18n } from 'vue-i18n'

const language = ref<Language>('en')
const templates = useTemplatesByLanguage(language)

const router = useRouter()
const openProfile = (newTextProfileId: TextProfileId) => {
  router.push({ path: 'options', query: { profileId: newTextProfileId } })
}

const { t } = useI18n()
</script>

<template>
  <div class="mx-auto p-2 text-base">
    <div class="text-2xl font-semibold">{{ t('SELECT_TEMPLATE.PLEASE_SELECT_A_TEMPLATE') }}</div>
    <div class="mt-3">{{ t('SELECT_TEMPLATE.CLICK_TO_MODIFY_OR_SELECT_TEMPLATE') }}</div>
    <div class="mt-3">
      <div>{{ t('SELECT_TEMPLATE.PROFILE_LANGUAGE') }}</div>
      <LanguageSelect v-model="language" class="select-secondary select select-sm w-40" />
    </div>
    <TextProfileCreateFromTemplate class="mt-3" :templates="templates" @created="openProfile" />
    <div class="mt-2 flex justify-end">
      <button class="btn-outline btn-secondary btn-sm btn" @click="router.push('/')">{{ t('SETTINGS.BACK') }}</button>
    </div>
  </div>
</template>
