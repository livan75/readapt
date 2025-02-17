/* global chrome  */
import { useExtensionUtils } from '@/shared/lib/extension'
import { textPreferencesStorageMigrate, TEXT_PREFERENCES_STORAGE_KEY } from '@/entities/textPreferences'

chrome.runtime.onInstalled.addListener(async () => {
  console.log('readapt installed or updated')

  await textPreferencesStorageMigrate(chrome.storage.local)

  const { enabled } = await chrome.storage.sync.get('enabled')
  const isEnabled = enabled ?? true

  chrome.contextMenus.create({
    title: 'Readapt',
    contexts: ['all'],
    id: 'readaptMenu',
    documentUrlPatterns: ['https://*/*', 'http://*/*']
  })

  chrome.contextMenus.create({
    title: 'Activate Readapt',
    contexts: ['all'],
    id: 'readaptActivateReadapt',
    parentId: 'readaptMenu',
    visible: !isEnabled
  })

  // chrome.contextMenus.create({
  //   title: 'Adapt whole page',
  //   contexts: ['all'],
  //   id: 'readaptMenuAdaptAction',
  //   parentId: 'readaptMenu',
  //   visible: isEnabled
  // })

  chrome.contextMenus.create({
    title: 'Activate mask',
    contexts: ['all'],
    id: 'readaptAddMask',
    parentId: 'readaptMenu',
    visible: isEnabled
  })

  chrome.contextMenus.create({
    title: 'Activate ruler',
    contexts: ['all'],
    id: 'readaptAddRuler',
    parentId: 'readaptMenu',
    visible: isEnabled
  })

  chrome.contextMenus.create({
    contexts: ['all'],
    id: 'separator',
    parentId: 'readaptMenu',
    visible: isEnabled,
    type: 'separator'
  })

  chrome.contextMenus.create({
    title: 'Reset all',
    contexts: ['all'],
    id: 'readaptMenuResetAction',
    parentId: 'readaptMenu',
    visible: isEnabled
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let message

  if (info.menuItemId === 'readaptActivateReadapt') {
    await chrome.storage.sync.set({ enabled: true })
    message = 'ENABLE'
  }

  if (info.menuItemId === 'readaptMenuAdaptAction') {
    message = 'ADAPT'
  }
  if (info.menuItemId === 'readaptMenuResetAction') {
    message = 'RESET'
  }
  if (info.menuItemId === 'readaptAddMask') {
    message = 'ADD_MASK'
  }
  if (info.menuItemId === 'readaptAddRuler') {
    message = 'ADD_RULER'
  }

  if (!message || !tab) {
    return
  }

  await chrome.tabs.sendMessage(tab.id as number, message)
})

declare const __MATOMO_URL__: string // __MATOMO_URL__ gets replaced with the actual value during build

chrome.storage.onChanged.addListener(async (changes) => {
  if (hasEnabledChanged(changes)) {
    const { enabled } = await chrome.storage.sync.get('enabled')
    const isEnabled = enabled ?? true
    switchEnabledContextMenu(isEnabled)
    return
  }

  if (hasSettingsChanged(changes)) {
    await useExtensionUtils().broadcastMessage('REFRESH')
  }

  if (hasEventChanged(changes)) {
    await fetch(`${__MATOMO_URL__}/matomo.php?idsite=1&action_name=adapt&rec=1&ua=unknown&uadata={}`)
  }
})

const hasEnabledChanged = (changes: { [p: string]: chrome.storage.StorageChange }): boolean => {
  for (const [key] of Object.entries(changes)) {
    if (key === 'enabled') {
      return true
    }
  }
  return false
}

const hasEventChanged = (changes: { [p: string]: chrome.storage.StorageChange }): boolean => {
  for (const [key] of Object.entries(changes)) {
    if (key === 'event') {
      return true
    }
  }
  return false
}

const switchEnabledContextMenu = (enabled: boolean): void => {
  // chrome.contextMenus.update('readaptMenuAdaptAction', { visible: enabled })
  chrome.contextMenus.update('readaptMenuResetAction', { visible: enabled })
  chrome.contextMenus.update('readaptAddMask', { visible: enabled })
  chrome.contextMenus.update('readaptAddRuler', { visible: enabled })
  // update activate readapt visibility
  chrome.contextMenus.update('readaptActivateReadapt', { visible: !enabled })
}

const hasSettingsChanged = (changes: { [p: string]: chrome.storage.StorageChange }): boolean => {
  for (const [key] of Object.entries(changes)) {
    if (key === TEXT_PREFERENCES_STORAGE_KEY) {
      return true
    }
  }
  return false
}
