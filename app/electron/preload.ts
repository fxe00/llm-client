import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => process.platform,
  
  // 文件操作
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content: string, filename: string) => ipcRenderer.invoke('save-file', content, filename),
  
  // 数据存储
  getData: (key: string) => ipcRenderer.invoke('get-data', key),
  setData: (key: string, value: any) => ipcRenderer.invoke('set-data', key, value),
  
  // 窗口控制
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  
  // 菜单事件监听
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_, action) => callback(action))
  },
  
  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>
      getPlatform: () => string
      openFile: () => Promise<string | null>
      saveFile: (content: string, filename: string) => Promise<boolean>
      getData: (key: string) => Promise<any>
      setData: (key: string, value: any) => Promise<boolean>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      onMenuAction: (callback: (action: string) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}
