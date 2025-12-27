// /lib/console-security.js
// Security utility to disable console in production

export function disableConsoleInProduction() {
  if (typeof window === 'undefined') return

  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'

  if (isProduction) {
    // Disable console methods
    const noop = () => {}
    console.log = noop
    console.error = noop
    console.warn = noop
    console.info = noop
    console.debug = noop
    console.trace = noop

    // Prevent console opening with F12, Ctrl+Shift+I, etc
    const disableDevTools = (event) => {
      if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (event.ctrlKey && event.shiftKey && event.key === 'C') ||
        (event.ctrlKey && event.shiftKey && event.key === 'J')
      ) {
        event.preventDefault()
        return false
      }
    }

    document.addEventListener('keydown', disableDevTools)
  }
}

// Also disable right-click context menu in production
export function disableContextMenuInProduction() {
  if (typeof window === 'undefined') return

  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'

  if (isProduction) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      return false
    })
  }
}
