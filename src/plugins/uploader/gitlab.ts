import { IPicGo, IPluginConfig, IGitlabConfig, IGitPostData } from '../../types'
import { Options } from 'request-promise-native'
import { IBuildInEvent } from '../../utils/enum'
import { ILocalesKey } from '../../i18n/zh-CN'
import { handleUrlEncode } from '../../utils/common'

const postOptions = (url: string, token: string, data: IGitPostData): Options => {
  return {
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      // Accept: '*/*',
      'User-Agent': 'PicGo',
      'Accept-Encoding': 'Accept-Encoding',
      'PRIVATE-TOKEN': token
    },
    body: data,
    json: true
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const githubOptions = ctx.getConfig<IGitlabConfig>('picBed.gitlab')
  if (!githubOptions) {
    throw new Error('Can\'t find gitlab config')
  }
  const { host, branch, group, project, project_id, token, path } = githubOptions
  const realImgUrlPre = `${host}/${group}/${project}/-/raw/${branch}/`

  const realUrl = `${host}/api/v4/projects/${project_id}/repository/files/${path}%2F`
  /**
   *
   * 这里是上传之后返回的文件完整url格式；该路径插入到md文档中
   * https://git.example.con/${group_name}/${project_name}/-/raw/${branch}/${path}/${img.fileName}
   * 上传文件的gitlab API url格式；文档：https://docs.gitlab.com/ee/api/repository_files.html
   * `https://git.example.con/api/v4/projects/${project_id}/repository/files/${encodeURI(path+'/'+img.fileName)}?ref=${branch}`
   *
   *  */

  try {
    const imgList = ctx.output
    for (const img of imgList) {
      if (img.fileName && img.buffer) {
        const base64Image = img.base64Image || Buffer.from(img.buffer).toString('base64')
        const postConfig = postOptions(
          `${realUrl}${handleUrlEncode(img.fileName)}?ref=${branch}`,
          token,
          {
            branch,
            encoding: 'base64',
            content: base64Image,
            commit_message: `feat: add a file ${img.fileName}`
          }
        )
        const result = await ctx.Request.request(postConfig)
        if (result) {
          delete img.base64Image
          delete img.buffer
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          img.imgUrl = `${realImgUrlPre}${result.file_path}`
        } else {
          // throw new Error('Server error, please try again')
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
  const userConfig = ctx.getConfig<IGitlabConfig>('picBed.gitlab') || {}
  const config: IPluginConfig[] = [
    {
      name: 'host',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_HOST'),
      default: userConfig.host || '',
      required: true
    },
    {
      name: 'group',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_GROUP'),
      default: userConfig.group || 'dev',
      required: true
    },
    {
      name: 'project',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_PEOGECT'),
      default: userConfig.project || '',
      required: true
    },
    {
      name: 'project_id',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_PEOGECT_ID'),
      default: userConfig.project_id || '',
      required: true
    },
    {
      name: 'branch',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_BRANCH'),
      default: userConfig.branch || '',
      required: true
    },
    {
      name: 'token',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_TOKEN'),
      default: userConfig.token || '',
      required: true
    },
    {
      name: 'path',
      type: 'input',
      alias: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB_PATH'),
      default: userConfig.path || '',
      required: true
    }
  ]
  return config
}

export default function register (ctx: IPicGo): void {
  ctx.helper.uploader.register('gitlab', {
    name: ctx.i18n.translate<ILocalesKey>('PICBED_GITLAB'),
    handle,
    config
  })
}
