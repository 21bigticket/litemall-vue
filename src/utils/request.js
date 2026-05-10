import axios from 'axios'
import { Dialog, Toast } from 'vant';

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // api 的 base_url
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
    config => {
    const accessToken = window.localStorage.getItem('Authorization') || '';
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (accessToken && !config.headers['X-Litemall-Token']) {
      config.headers['X-Litemall-Token'] = accessToken;
    }
    return config;
  },
  err => Promise.reject(err)
)

// response interceptor
service.interceptors.response.use(
  response => {
    const res = response.data

    if (typeof res.code !== 'undefined') {
      const businessCode = res.code && typeof res.code === 'object' && typeof res.code.value !== 'undefined'
        ? res.code.value
        : res.code;

      if (businessCode === 0) {
        return response;
      }

      return Promise.reject(response);
    }

    if (res.errno === 501) {
        Toast.fail('请登录');
        setTimeout(() => {
          window.location = '#/login/'
        }, 1500)
      return Promise.reject('error')
    } else if (res.errno === 502) {
        Toast.fail('网站内部错误，请联系网站维护人员')
      return Promise.reject('error')
    } if (res.errno === 401) {
      Toast.fail('参数不对');
      return Promise.reject('error')
    } if (res.errno === 402) {
      Toast.fail('参数值不对');
      return Promise.reject('error')
    } else if (res.errno !== 0) {
      // 非5xx的错误属于业务错误，留给具体页面处理
      return Promise.reject(response)
    } else {
      return response
    }
  }, error => {
    console.log('err' + error)// for debug
    if (error && error.response && error.response.status === 401) {
      Toast.fail('请重新登录');
      setTimeout(() => {
        window.location = '#/login/'
      }, 1000)
      return Promise.reject(error)
    }
    Dialog.alert({
        title: '警告',
        message: '登录连接超时'
      });
    return Promise.reject(error)
  })

export default service
