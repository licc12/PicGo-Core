import Minio from 'minio'
import { IPicGo, IPluginConfig, IMinioConfig } from '../../types'
import { IBuildInEvent } from '../../utils/enum'
import { ILocalesKey } from '../../i18n/zh-CN'

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const minioOptions = ctx.getConfig<IMinioConfig>('picBed.minio')
  if (!minioOptions) {
    throw new Error('Can\'t find minio config')
  }
  const {
    endPoint,
    // port,
    accessKey,
    secretKey,
    bucketName,
    // useSSL,
    region,
    transport,
    sessionToken
    // partSize
  } = minioOptions

  var minioClient = new Minio.Client({
    endPoint,
    accessKey,
    secretKey,
    region,
    transport,
    sessionToken
    // partSize
  })

  try {
    const imgList = ctx.output
    for (const img of imgList) {
      if (img.fileName && img.buffer) {
        await minioClient.putObject(bucketName, img.fileName, img.buffer)
        const realImgUrlPre = `https://${endPoint}/${bucketName}/${img.fileName}`
        img.imgUrl = realImgUrlPre
        delete img.base64Image
        delete img.buffer
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
