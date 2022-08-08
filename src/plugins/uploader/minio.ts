import Minio from 'minio'
import { IPicGo, IPluginConfig, IMinioConfig } from '../../types'
import { IBuildInEvent } from '../../utils/enum'
import { ILocalesKey } from '../../i18n/zh-CN'

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const githubOptions = ctx.getConfig<IMinioConfig>('picBed.minio')
  if (!githubOptions) {
    throw new Error('Can\'t find minio config')
  }
  const {
    endPoint,
    port,
    accessKey,
    secretKey,
    bucketName,
    useSSL,
    region,
    transport,
    sessionToken,
    partSize
  } = githubOptions

  var minioClient = new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
    region,
    transport,
    sessionToken,
    partSize
  })
  const realImgUrlPre = `${endPoint}/${bucketName}/`

  // const realUrl = `${host}/api/v4/projects/${project_id}/repository/files/${path}%2F`

  try {
    const imgList = ctx.output
    for (const img of imgList) {
      if (img.fileName && img.buffer) {
        const base64Image = img.base64Image || Buffer.from(img.buffer).toString('base64')
        const result = await minioClient.putObject(bucketName, img.fileName, base64Image)
        if (result.etag && result.versionId) {
          delete img.base64Image
          delete img.buffer
          img.imgUrl = `${realImgUrlPre}${img.fileName}`
        } else {
          ctx.emit(IBuildInEvent.NOTIFICATION, {
            title: ctx.i18n.translate<ILocalesKey>('UPLOAD_FAILED'),
            body: '上传失败！'
          })
          throw new Error('Server error, please try again')
        }
      }
    }
    return ctx
  } catch (err) {
    ctx.emit(IBuildInEvent.NOTIFICATION, {
      title: ctx.i18n.translate<ILocalesKey>('UPLOAD_FAILED'),
      // body: ctx.i18n.translate<ILocalesKey>('CHECK_SETTINGS_AND_NETWORK')
      body: err
    })
    throw err
  }
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const userConfig = ctx.getConfig<IMinioConfig>('picBed.minio') || {}
  const config: IPluginConfig[] = [
    {
      name: 'endPoint',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_ENDPOINT'),
      default: userConfig.endPoint || '',
      required: true
    },
    {
      name: 'port',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_PORT'),
      default: userConfig.port || '',
      required: false
    },
    {
      name: 'accessKey',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_ACCESSKEY'),
      default: userConfig.accessKey || '',
      required: true
    },
    {
      name: 'secretKey',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_SECRETKEY'),
      default: userConfig.secretKey || '',
      required: true
    },
    {
      name: 'bucketName',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_BUCKETNAME'),
      default: userConfig.bucketName || '',
      required: true
    },
    {
      name: 'useSSL',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_USESSL'),
      default: userConfig.useSSL || '',
      required: false
    },
    {
      name: 'region',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_REGION'),
      default: userConfig.region || '',
      required: false
    },
    {
      name: 'transport',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_TRANSPORT'),
      default: userConfig.transport || '',
      required: false
    },
    {
      name: 'sessionToken',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_SESSIONTOKEN'),
      default: userConfig.sessionToken || '',
      required: false
    },
    {
      name: 'partSize',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO_PARTSIZE'),
      default: userConfig.partSize || 64,
      required: false
    }
  ]
  return config
}

export default function register (ctx: IPicGo): void {
  ctx.helper.uploader.register('minio', {
    name: ctx.i18n.translate<ILocalesKey>('PICBED_MINIO'),
    handle,
    config
  })
}
