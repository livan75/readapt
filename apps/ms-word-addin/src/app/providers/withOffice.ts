let promise: Promise<void> | null = null

export const withOffice = async () => {
  const replaceState = window.history.replaceState
  const pushState = window.history.pushState

  if (!promise) {
    promise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js'
      script.onload = () => {
        Office.onReady(() => {
          // Note: this is a workaround to fix msoffice breaking vue-router
          // @see https://github.com/OfficeDev/office-js/pull/2808
          window.history.replaceState = replaceState
          window.history.pushState = pushState

          resolve()
        })
      }
      document.body.appendChild(script)
    })
  }
  return promise
}
