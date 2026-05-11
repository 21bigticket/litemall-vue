export default [
  {
    path: '/login',
    name: 'login',
    meta: {
      showHeader:false,
      title:"登录"
    },
    component: () => import('@/views/login/login')
  },
  {
    path: '/login/register',
    name: 'register',
    component: () => import('@/views/login/register-getCode')
  },
  {
    path: '/login/registerStatus/:status',
    name: 'registerStatus',
    props: true,
    component: () => import('@/views/login/register-status')
  },
  {
    path: '/login/forget',
    name: 'forget',
    component: () => import('@/views/login/forget')
  },
  {
    path: '/login/forget/status/:status',
    name: 'forgetStatus',
    props: true,
    component: () => import('@/views/login/forget-status')
  }
];
