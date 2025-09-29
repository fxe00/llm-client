import { app } from 'electron'
import { join } from 'path'

export const getAppPath = () => {
  return app.getPath('userData')
}

export const getDataPath = () => {
  return join(getAppPath(), 'data')
}

export const getCachePath = () => {
  return join(getAppPath(), 'cache')
}

export const getLogPath = () => {
  return join(getAppPath(), 'logs')
}
