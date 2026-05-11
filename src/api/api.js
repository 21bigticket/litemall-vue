import request from '@/utils/request'

const ZebraApiBase = process.env.VUE_APP_TRIPLE_API || '/dev-api';
const ZebraMemberService = `${ZebraApiBase}/zebra-member/member.MemberService`;
const ZebraMemberAuthService = `${ZebraApiBase}/zebra-member/member_auth.MemberAuthService`;
const ZebraGoodsService = `${ZebraApiBase}/zebra-goods/goods.GoodsService`;
const ZebraSkuService = `${ZebraApiBase}/zebra-goods/sku.SkuService`;
const ZebraCategoryService = `${ZebraApiBase}/zebra-goods/category.CategoryService`;
const ZebraBrandService = `${ZebraApiBase}/zebra-goods/brand.BrandService`;
const ZebraCartService = `${ZebraApiBase}/zebra-cart/cart.CartService`;
const ZebraCollectService = `${ZebraApiBase}/zebra-member/member.MemberCollectService`;
const ZebraMemberAddressService = `${ZebraApiBase}/zebra-member/member.MemberAddressService`;
const ZebraOrderService = `${ZebraApiBase}/zebra-order/order.OrderService`;
const ZebraPaymentService = `${ZebraApiBase}/zebra-pay/payment.PaymentService`;
const ZebraStockService = `${ZebraApiBase}/zebra-stock/stock.StockService`;
const ZebraAfterSalesService = `${ZebraApiBase}/zebra-order/after_sales.AfterSalesService`;
const ZebraFileService = `${ZebraApiBase}/zebra-config/file.FileService`;
const ZebraCouponService = `${ZebraApiBase}/zebra-activity/coupon.CouponService`;
const ZebraUserCouponService = `${ZebraApiBase}/zebra-activity/user_coupon.UserCouponService`;
const ZebraTopicService = `${ZebraApiBase}/zebra-activity/topic.TopicService`;

function successPayload(data) {
  return {
    errno: 0,
    errmsg: 'success',
    data
  };
}

function authBizType(type) {
  const normalized = String(type || '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }
  if (normalized === 'bind-mobile') {
    return 'change-mobile';
  }
  if (normalized === 'change-password') {
    return 'reset-password';
  }
  return normalized;
}

function localUserId() {
  return Number(window.localStorage.getItem('userId') || 0);
}

function wrapLegacyResponse(res, data) {
  return Object.assign({}, res, {
    data: successPayload(data)
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = String(result).includes(',') ? String(result).split(',')[1] : String(result);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function centsToYuan(value) {
  return Number(((value || 0) / 100).toFixed(2));
}

function normalizeInt64List(input) {
  if (Array.isArray(input)) {
    return input.map(item => Number(item) || 0).filter(item => item > 0);
  }
  if (typeof input === 'string') {
    return input.split(',').map(item => Number(item.trim()) || 0).filter(item => item > 0);
  }
  if (typeof input === 'number') {
    return input > 0 ? [input] : [];
  }
  return [];
}

function selectedCartItemIds(input) {
  const parsed = normalizeInt64List(input);
  if (parsed.length > 0) {
    return parsed;
  }
  return normalizeInt64List(window.localStorage.getItem('SelectedCartItemIds'));
}

function buildAddressText(address = {}) {
  return [
    address.province || '',
    address.city || '',
    address.region || '',
    address.street || ''
  ].filter(Boolean).join(' ');
}

function adaptAddressForView(address = {}) {
  return {
    id: address.id,
    name: address.receiver_name || '',
    tel: address.receiver_phone || '',
    postalCode: address.postal_code || '',
    isDefault: address.default_option === 1,
    country: address.country || '',
    province: address.province || '',
    city: address.city || '',
    county: address.region || '',
    addressDetail: address.street || '',
    address: buildAddressText(address)
  };
}

function adaptCartItem(item = {}) {
  return {
    id: item.item_id,
    itemId: item.item_id,
    goodsName: item.sku_name,
    price: centsToYuan(item.price),
    number: item.quantity,
    picUrl: item.sku_image,
    specifications: parseSkuSpecs(item.sku_name),
    checked: true,
    goodsId: 0,
    productId: item.sku_id,
    skuId: item.sku_id
  };
}

function orderStatusText(status) {
  switch (status) {
    case 0:
      return '待付款';
    case 1:
      return '待发货';
    case 2:
      return '待收货';
    case 3:
      return '已完成';
    case 4:
      return '已取消';
    case 5:
      return '售后中';
    default:
      return '未知状态';
  }
}

function orderHandleOption(status) {
  return {
    cancel: status === 0,
    pay: status === 0,
    delete: status === 3 || status === 4,
    confirm: status === 2,
    refund: status === 3,
    comment: false
  };
}

function adaptOrderItems(items = []) {
  return items.map(item => ({
    id: item.item_id,
    goodsName: item.sku_name,
    number: item.quantity,
    price: centsToYuan(item.price),
    picUrl: item.sku_image || '',
    specifications: parseSkuSpecs(item.sku_name)
  }));
}

function adaptOrderInfo(order = {}, items = [], delivery = null) {
  return {
    id: order.order_id,
    orderSn: order.order_no,
    orderStatus: order.order_status,
    orderStatusText: orderStatusText(order.order_status),
    handleOption: orderHandleOption(order.order_status),
    consignee: order.receiver_name || '',
    mobile: order.receiver_phone || '',
    address: order.receiver_address || '',
    addTime: order.create_time ? new Date(order.create_time * 1000).toLocaleString() : '',
    actualPrice: centsToYuan(order.pay_amount),
    goodsPrice: centsToYuan(order.total_amount),
    freightPrice: centsToYuan(order.freight_amount),
    orderPrice: centsToYuan(order.total_amount),
    couponPrice: centsToYuan(order.discount_amount),
    post_fee: centsToYuan(order.freight_amount),
    orderGoods: adaptOrderItems(items),
    payAmountCents: order.pay_amount || 0,
    expCode: delivery && delivery.delivery_comp ? delivery.delivery_comp : '',
    expNo: delivery && delivery.delivery_no ? delivery.delivery_no : ''
  };
}

function defaultCheckoutAddress(addresses = [], preferredAddressId = 0) {
  if (preferredAddressId > 0) {
    const matched = addresses.find(item => item.id === preferredAddressId);
    if (matched) {
      return matched;
    }
  }
  return addresses.find(item => item.default_option === 1) || addresses[0] || null;
}

function fetchOrderDetailById(orderId) {
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/GetOrder`,
    method: 'post',
    data: {
      order_id: Number(orderId) || 0
    }
  }).then(res => res.data);
}

function parseSkuSpecs(rawSpecs) {
  if (!rawSpecs) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawSpecs);
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          return item.value || item.name || item.label || '';
        }
        return '';
      }).filter(Boolean);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed).map(key => parsed[key]).filter(Boolean);
    }
  } catch (e) {
    return rawSpecs.split(/[,，|/]/).map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function buildSpecificationListFromSkus(skus = []) {
  const groupMap = new Map();
  skus.forEach((sku, skuIndex) => {
    const specs = parseSkuSpecs(sku.specs);
    specs.forEach((specValue, index) => {
      const groupKey = `规格${index + 1}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, new Map());
      }
      const valueMap = groupMap.get(groupKey);
      if (!valueMap.has(specValue)) {
        valueMap.set(specValue, {
          id: `${sku.id}_${index}_${specValue}_${skuIndex}`,
          value: specValue,
          picUrl: sku.image_url || ''
        });
      }
    });
  });

  return Array.from(groupMap.entries()).map(([name, valueMap]) => ({
    name,
    valueList: Array.from(valueMap.values())
  }));
}

function adaptGoodsListItem(goods) {
  return {
    id: goods.id,
    name: goods.name,
    brief: goods.sub_title || '',
    picUrl: goods.main_image || '',
    sortOrder: goods.sort_order || 0,
    createTime: goods.create_time || 0,
    retailPrice: 0,
    counterPrice: 0
  };
}

function adaptBrandListItem(brand = {}) {
  return {
    id: brand.id,
    name: brand.name || '',
    picUrl: brand.logo_url || '',
    desc: brand.description || '',
    floorPrice: 0
  };
}

function adaptTopicListItem(topic = {}) {
  return {
    id: topic.id,
    title: topic.title || '',
    subtitle: topic.subtitle || '',
    picUrl: topic.pic_url || '',
    readCount: topic.read_count || 0
  };
}

function enrichGoodsListWithSkuPrice(goodsList = [], skuRespList = []) {
  return goodsList.map((goods, index) => {
    const skuResp = skuRespList[index];
    const skuList = skuResp && skuResp.data ? (skuResp.data.skus || []) : [];
    const enabledSkus = skuList.filter(item => item.status === 1);
    const firstSku = enabledSkus[0] || skuList[0];
    return Object.assign({}, adaptGoodsListItem(goods), {
      retailPrice: firstSku ? centsToYuan(firstSku.price) : 0,
      counterPrice: firstSku ? centsToYuan(firstSku.price) : 0
    });
  });
}

function memberAuthUserFromResp(data = {}) {
  const userInfo = data.user_info || data.userInfo || {};
  return {
    userId: userInfo.user_id || userInfo.userId || 0,
    userName: userInfo.user_name || userInfo.userName || '',
    nickName: userInfo.nick_name || userInfo.nickName || userInfo.user_name || userInfo.userName || '',
    avatarUrl: userInfo.head_url || userInfo.headUrl || '',
    mobile: userInfo.phone || '',
    email: userInfo.email || ''
  };
}

function memberInfoFromResp(data = {}) {
  const member = data.member || {};
  return {
    userId: member.user_id || member.userId || 0,
    avatar: member.head_url || member.headUrl || '',
    nickName: member.nick_name || member.nickName || member.user_name || member.userName || '',
    gender: 0,
    mobile: member.phone || '',
    email: member.email || ''
  };
}

const IndexUrl= '/home/index'; //首页数据接口
export async function getHome() {
  const [categoryRes, brandRes, goodsRes, couponRes, topicRes] = await Promise.all([
    request({
      baseURL: '',
      url: `${ZebraCategoryService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 8,
        parent_id: 0,
        level: 1,
        status: 1
      }
    }).catch(() => ({ data: { categories: [] } })),
    request({
      baseURL: '',
      url: `${ZebraBrandService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 4,
        name_keyword: '',
        status: 1
      }
    }).catch(() => ({ data: { brands: [] } })),
    request({
      baseURL: '',
      url: `${ZebraGoodsService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 12,
        category_id: -1,
        brand_id: 0,
        vendor_id: -1,
        status: 1,
        name_keyword: ''
      }
    }).catch(() => ({ data: { goods: [], total: 0 } })),
    request({
      baseURL: '',
      url: `${ZebraCouponService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 4,
        type: -1,
        status: 1
      }
    }).catch(() => ({ data: { coupons: [] } })),
    request({
      baseURL: '',
      url: `${ZebraTopicService}/ListTopic`,
      method: 'post',
      data: {
        page: 1,
        page_size: 4,
        status: 1
      }
    }).catch(() => ({ data: { topics: [] } }))
  ]);

  const goods = goodsRes.data.goods || [];
  const skuReqs = goods.map(item => request({
    baseURL: '',
    url: `${ZebraSkuService}/List`,
    method: 'post',
    data: {
      page: 1,
      page_size: 20,
      goods_id: item.id,
      status: 1
    }
  }).catch(() => ({ data: { skus: [] } })));
  const skuRespList = await Promise.all(skuReqs);
  const goodsListData = enrichGoodsListWithSkuPrice(goods, skuRespList);

  const banner = goodsListData.slice(0, 4).map(item => ({
    url: item.picUrl,
    link: `#/items/detail/${item.id}`
  }));
  const channel = (categoryRes.data.categories || []).map(item => ({
    id: item.id,
    name: item.name,
    iconUrl: item.icon_url || ''
  }));
  const brandList = (brandRes.data.brands || []).map(adaptBrandListItem);
  const couponList = (couponRes.data.coupons || []).map(item => ({
    id: item.id,
    name: item.name,
    desc: `满${centsToYuan(item.min_amount || 0)}可用`,
    tag: item.type === 2 ? '折扣券' : '优惠券',
    days: item.valid_days || 0,
    discount: centsToYuan(item.discount_amount || 0)
  }));
  const topicList = (topicRes.data.topics || []).map(adaptTopicListItem);

  return wrapLegacyResponse(goodsRes, {
    banner,
    channel,
    couponList,
    grouponList: [],
    brandList,
    newGoodsList: goodsListData.slice(0, 4),
    hotGoodsList: goodsListData.slice(4, 10),
    topicList
  })
}

const CatalogList='/catalog/index'; //分类目录全部分类数据接口
export async function catalogList() {
  const rootRes = await request({
    baseURL: '',
    url: `${ZebraCategoryService}/List`,
    method: 'post',
    data: {
      page: 1,
      page_size: 100,
      parent_id: 0,
      level: 1,
      status: 1
    }
  });
  const rootCategories = rootRes.data.categories || [];
  const currentRoot = rootCategories[0] || {};
  const currentChildrenRes = currentRoot.id ? await request({
    baseURL: '',
    url: `${ZebraCategoryService}/List`,
    method: 'post',
    data: {
      page: 1,
      page_size: 100,
      parent_id: currentRoot.id,
      level: -1,
      status: 1
    }
  }) : { data: { categories: [] } };
  return wrapLegacyResponse(rootRes, {
    categoryList: rootCategories.map(item => ({
      id: item.id,
      name: item.name,
      picUrl: item.icon_url || item.iconUrl || ''
    })),
    currentCategory: {
      id: currentRoot.id || 0,
      name: currentRoot.name || '',
      desc: '',
      picUrl: currentRoot.icon_url || currentRoot.iconUrl || ''
    },
    currentSubCategory: (currentChildrenRes.data.categories || []).map(item => ({
      id: item.id,
      name: item.name,
      picUrl: item.icon_url || item.iconUrl || ''
    }))
  });
}

const CatalogCurrent='/catalog/current'; //分类目录当前分类数据接口
export async function catalogCurrent(query) {
  const currentId = Number(query && query.id) || 0;
  const currentRes = await request({
    baseURL: '',
    url: `${ZebraCategoryService}/Get`,
    method: 'post',
    data: { id: currentId }
  });
  const currentCategoryRaw = currentRes.data.category || {};
  const parentId = currentCategoryRaw.parent_id || currentCategoryRaw.parentId || 0;
  const rootId = parentId > 0 ? parentId : currentCategoryRaw.id;
  const siblingRes = await request({
    baseURL: '',
    url: `${ZebraCategoryService}/List`,
    method: 'post',
    data: {
      page: 1,
      page_size: 100,
      parent_id: rootId,
      level: -1,
      status: 1
    }
  });
  return wrapLegacyResponse(currentRes, {
    categoryList: (siblingRes.data.categories || []).map(item => ({
      id: item.id,
      name: item.name,
      picUrl: item.icon_url || item.iconUrl || ''
    })),
    currentCategory: {
      id: currentCategoryRaw.id,
      name: currentCategoryRaw.name,
      desc: '',
      picUrl: currentCategoryRaw.icon_url || currentCategoryRaw.iconUrl || ''
    },
    currentSubCategory: (siblingRes.data.categories || []).map(item => ({
      id: item.id,
      name: item.name,
      picUrl: item.icon_url || item.iconUrl || ''
    }))
  });
}

const AuthLoginByWeixin='/auth/login_by_weixin'; //微信登录


const AuthLoginByAccount=`${ZebraMemberAuthService}/Login`; //账号登录
export function authLoginByAccount(data) {
  const account = data.username || data.mobile || data.email || '';
  return request({
    baseURL: '',
    url: AuthLoginByAccount,
    method: 'post',
    data: {
      account,
      password: data.password
    }
  }).then(res => Object.assign({}, res, {
    data: {
      errno: 0,
      errmsg: 'success',
      data: {
        token: res.data.token,
        userInfo: memberAuthUserFromResp(res.data)
      }
    }
  }))
}
const AuthLogout='/auth/logout'; //账号登出
export function authLogout() {
  const userId = Number(window.localStorage.getItem('userId') || 0);
  return request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/Logout`,
    method: 'post',
    data: {
      user_id: userId
    }
  }).then(res => wrapLegacyResponse(res, true))
}
const AuthInfo=`${ZebraMemberService}/Get`; //用户信息
export function authInfo() {
  const userId = Number(window.localStorage.getItem('userId') || 0);
  return request({
    baseURL: '',
    url: AuthInfo,
    method: 'post',
    data: {
      user_id: userId
    }
  }).then(res => Object.assign({}, res, {
    data: {
      errno: 0,
      errmsg: 'success',
      data: memberInfoFromResp(res.data)
    }
  }))
}
const AuthProfile=`${ZebraMemberService}/Update`; //账号修改
export function authProfile(data) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/UpdateProfile`,
    method: 'post',
    data: {
      nick_name: data.nickname || data.nickName || '',
      email: data.email || '',
      phonenumber: data.mobile || data.phone || '',
      sex: data.sex || ''
    }
  })
}
export async function authUploadAvatar(file) {
  const rawFile = file && (file.file || file);
  if (!rawFile) {
    throw new Error('avatar file is required');
  }
  const fileData = await fileToBase64(rawFile);
  const uploadRes = await request({
    baseURL: '',
    url: `${ZebraFileService}/Upload`,
    method: 'post',
    timeout: 30000,
    data: {
      biz_type: 'user/avatar',
      file_name: rawFile.name || 'avatar.png',
      content_type: rawFile.type || 'image/png',
      file_data: fileData
    }
  });
  const avatarUrl = uploadRes && uploadRes.data && uploadRes.data.url ? uploadRes.data.url : '';
  if (!avatarUrl) {
    throw new Error('upload avatar failed');
  }
  await request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/UploadAvatar`,
    method: 'post',
    data: {
      file_name: avatarUrl
    }
  });
  return avatarUrl;
}
const AuthRegister=`${ZebraMemberAuthService}/Register`; //账号注册
export function authRegister(data) {
  return request({
    baseURL: '',
    url: AuthRegister,
    method: 'post',
    data: {
      password: data.password,
      repeat_password: data.repeatPassword,
      phone: data.mobile
    }
  }).then(res => Object.assign({}, res, {
    data: {
      errno: 0,
      errmsg: 'success',
      data: {
        userInfo: memberAuthUserFromResp(res.data)
      }
    }
  }))
}
const AuthChangePassword=`${ZebraMemberAuthService}/ChangePassword`; //通过原密码修改密码
export function authChangePassword(data) {
  return request({
    baseURL: '',
    url: AuthChangePassword,
    method: 'post',
    data: {
      account: data.mobile || data.account || '',
      old_password: data.oldPassword || '',
      new_password: data.newPassword || '',
      repeat_password: data.repeatPassword || ''
    }
  })
}
const AuthReset='/auth/reset'; //账号密码重置
export function authReset(data) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/ResetPassword`,
    method: 'post',
    data: {
      mobile: data.mobile || '',
      password: data.password || '',
      repeat_password: data.repeatPassword || data.repeat_password || data.password || '',
      verify_code: data.code || data.verifyCode || ''
    }
  })
}
const AuthRegisterCaptcha='/auth/regCaptcha'; //注册验证码
export function authRegisterCaptcha(data) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/SendVerifyCode`,
    method: 'post',
    data: {
      mobile: data.mobile || '',
      biz_type: authBizType(data.type || 'register')
    }
  })
}
const AuthCaptcha='/auth/captcha'; //验证码
export function authCaptcha(data) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/SendVerifyCode`,
    method: 'post',
    data: {
      mobile: data.mobile || '',
      biz_type: authBizType(data.type || '')
    }
  })
}
export function authChangeMobile(data) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAuthService}/ChangeMobile`,
    method: 'post',
    data: {
      user_id: localUserId(),
      password: data.password || '',
      new_mobile: data.mobile || data.newMobile || '',
      verify_code: data.code || data.verifyCode || ''
    }
  })
}

const GoodsCount='/goods/count'; //统计商品总数
export function goodsCount() {
  return request({
    url: GoodsCount,
    method: 'get'
  })
}
export const GoodsList='/goods/list'; //获得商品列表
export function goodsList(query) {
  const page = Number(query && query.page) || 1;
  const pageSize = Number((query && (query.limit || query.pageSize))) || 10;
  const categoryId = Number(query && query.categoryId) || -1;
  const brandId = Number(query && query.brandId) || 0;
  const nameKeyword = query && query.keyword ? query.keyword : '';
  const isHot = !!(query && query.isHot);
  const isNew = !!(query && query.isNew);

  return request({
    baseURL: '',
    url: `${ZebraGoodsService}/List`,
    method: 'post',
    data: {
      page,
      page_size: pageSize,
      category_id: categoryId,
      brand_id: brandId,
      vendor_id: -1,
      status: 1,
      name_keyword: nameKeyword
    }
  }).then(async res => {
    const goods = res.data.goods || [];
    const skuReqs = goods.map(item => request({
      baseURL: '',
      url: `${ZebraSkuService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 20,
        goods_id: item.id,
        status: 1
      }
    }).catch(() => ({ data: { skus: [] } })));
    const skuRespList = await Promise.all(skuReqs);
    let list = enrichGoodsListWithSkuPrice(goods, skuRespList);
    if (isHot) {
      list = list.slice().sort((a, b) => {
        const sortDelta = Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
        if (sortDelta !== 0) {
          return sortDelta;
        }
        return Number(b.createTime || 0) - Number(a.createTime || 0);
      });
    } else if (isNew) {
      list = list.slice().sort((a, b) => Number(b.createTime || 0) - Number(a.createTime || 0));
    }
    const start = (page - 1) * pageSize;
    const pagedList = list.slice(start, start + pageSize);
    return wrapLegacyResponse(res, {
      list: pagedList,
      page,
      limit: pageSize,
      pages: Math.ceil(list.length / pageSize),
      total: list.length
    });
  })
}
const GoodsCategory='/goods/category'; //获得分类数据
export function goodsCategory(query) {
  const currentId = Number(query && query.id) || 0;
  return request({
    baseURL: '',
    url: `${ZebraCategoryService}/Get`,
    method: 'post',
    data: { id: currentId }
  }).then(async res => {
    const currentCategoryRaw = res.data.category || {};
    const parentId = currentCategoryRaw.parent_id || 0;
    const siblingResp = await request({
      baseURL: '',
      url: `${ZebraCategoryService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 100,
        parent_id: parentId || -1,
        level: -1,
        status: 1
      }
    });
    let parentCategory = { id: 0, name: '全部', desc: '' };
    if (parentId > 0) {
      const parentResp = await request({
        baseURL: '',
        url: `${ZebraCategoryService}/Get`,
        method: 'post',
        data: { id: parentId }
      });
      const parentRaw = parentResp.data.category || {};
      parentCategory = {
        id: parentRaw.id,
        name: parentRaw.name,
        desc: ''
      };
    }

    const brotherCategory = (siblingResp.data.categories || []).map(item => ({
      id: item.id,
      name: item.name,
      picUrl: item.icon_url || item.iconUrl || ''
    }));
    const currentCategory = {
      id: currentCategoryRaw.id,
      name: currentCategoryRaw.name,
      desc: '',
      picUrl: currentCategoryRaw.icon_url || currentCategoryRaw.iconUrl || ''
    };
    return wrapLegacyResponse(res, {
      currentCategory,
      parentCategory,
      brotherCategory
    });
  })
}
const GoodsDetail='/goods/detail'; //获得商品的详情
export function goodsDetail(query) {
  const goodsId = Number(query && query.id) || 0;
  return Promise.all([
    request({
      baseURL: '',
      url: `${ZebraGoodsService}/Get`,
      method: 'post',
      data: { id: goodsId }
    }),
    request({
      baseURL: '',
      url: `${ZebraSkuService}/List`,
      method: 'post',
      data: {
        page: 1,
        page_size: 100,
        goods_id: goodsId,
        status: 1
      }
    }),
    localUserId() > 0 ? request({
      baseURL: '',
      url: `${ZebraCollectService}/CheckStatus`,
      method: 'post',
      data: {
        user_id: localUserId(),
        goods_id: goodsId,
        sku_id: 0
      }
    }).catch(() => ({ data: { collect_status: 0 } })) : Promise.resolve({ data: { collect_status: 0 } })
  ]).then(([goodsRes, skuRes, collectRes]) => {
    const goods = goodsRes.data.goods || {};
    const skus = skuRes.data.skus || [];
    const firstSku = skus[0] || {};
    const specificationList = buildSpecificationListFromSkus(skus);
    const productList = skus.map(item => ({
      id: item.id,
      goodsId: item.goods_id,
      specifications: parseSkuSpecs(item.specs),
      price: centsToYuan(item.price),
      number: item.stock_num,
      url: item.image_url || ''
    }));

    return wrapLegacyResponse(goodsRes, {
      info: {
        id: goods.id,
        name: goods.name,
        brief: goods.sub_title || '',
        picUrl: goods.main_image || '',
        gallery: goods.gallery_images || (goods.main_image ? [goods.main_image] : []),
        detail: goods.detail || '',
        retailPrice: centsToYuan(firstSku.price),
        counterPrice: centsToYuan(firstSku.price)
      },
      attribute: [],
      specificationList,
      productList,
      userHasCollect: collectRes.data.collect_status === 1 ? 1 : 0
    });
  })
}
const GoodsRelated='/goods/related'; //商品详情页的关联商品（大家都在看）

const BrandList='/brand/list'; //品牌列表
export function brandList(query) {
  const page = Number(query && query.page) || 1;
  const limit = Number(query && query.limit) || 10;
  return request({
    baseURL: '',
    url: `${ZebraBrandService}/List`,
    method: 'post',
    data: {
      page,
      page_size: limit,
      name_keyword: '',
      status: 1
    }
  }).then(res => wrapLegacyResponse(res, {
    list: (res.data.brands || []).map(adaptBrandListItem),
    page,
    limit,
    pages: Math.ceil((res.data.total || 0) / limit),
    total: res.data.total || 0
  }))
}
const BrandDetail='/brand/detail'; //品牌详情
export function brandDetail(query) {
  return request({
    baseURL: '',
    url: `${ZebraBrandService}/Get`,
    method: 'post',
    data: { id: Number(query && query.id) || 0 }
  }).then(res => wrapLegacyResponse(res, {
    id: res.data.brand && res.data.brand.id,
    name: res.data.brand && res.data.brand.name,
    picUrl: (res.data.brand && res.data.brand.logo_url) || '',
    desc: (res.data.brand && res.data.brand.description) || ''
  }))
}

const CartList='/cart/index'; //获取购物车的数据
export function cartList(query) {
  return request({
    baseURL: '',
    url: `${ZebraCartService}/GetCart`,
    method: 'post',
    data: {
      user_id: localUserId(),
      user_coupon_id: 0
    }
  }).then(res => wrapLegacyResponse(res, {
    cartList: (res.data.items || []).map(item => ({
      id: item.item_id,
      goodsName: item.sku_name,
      price: centsToYuan(item.price),
      number: item.quantity,
      picUrl: item.sku_image,
      specifications: parseSkuSpecs(item.sku_name),
      checked: true,
      goodsId: 0,
      productId: item.sku_id
    }))
  }))
}
const CartAdd='/cart/add'; // 添加商品到购物车
export function cartAdd(data) {
  return request({
    baseURL: '',
    url: `${ZebraSkuService}/Get`,
    method: 'post',
    data: {
      id: Number(data.productId || data.skuId || 0)
    }
  }).then(skuRes => {
    const sku = skuRes.data.sku || {};
    return request({
      baseURL: '',
      url: `${ZebraCartService}/AddItem`,
      method: 'post',
      data: {
        user_id: localUserId(),
        sku_id: sku.id,
        sku_name: sku.name,
        sku_image: sku.image_url || '',
        price: sku.price || 0,
        quantity: Number(data.number || data.quantity || 1)
      }
    });
  }).then(res => wrapLegacyResponse(res, true))
}
const CartFastAdd='/cart/fastadd'; // 立即购买商品
export function cartFastAdd(data) {
  return request({
    baseURL: '',
    url: `${ZebraSkuService}/Get`,
    method: 'post',
    data: {
      id: Number(data.productId || data.skuId || 0)
    }
  }).then(skuRes => {
    const sku = skuRes.data.sku || {};
    return request({
      baseURL: '',
      url: `${ZebraCartService}/AddItem`,
      method: 'post',
      data: {
        user_id: localUserId(),
        sku_id: sku.id,
        sku_name: sku.name,
        sku_image: sku.image_url || '',
        price: sku.price || 0,
        quantity: Number(data.number || data.quantity || 1)
      }
    });
  }).then(res => wrapLegacyResponse(res, res.data.item ? res.data.item.item_id : 0))
}
const CartUpdate='/cart/update'; // 更新购物车的商品
export function cartUpdate(data) {
  return request({
    baseURL: '',
    url: `${ZebraCartService}/UpdateQuantity`,
    method: 'post',
    data: {
      user_id: localUserId(),
      item_id: Number(data.id || data.itemId || 0),
      quantity: Number(data.number || data.quantity || 1)
    }
  }).then(res => wrapLegacyResponse(res, true))
}
const CartDelete='/cart/delete'; // 删除购物车的商品
export function cartDelete(data) {
  return request({
    baseURL: '',
    url: `${ZebraCartService}/BatchRemove`,
    method: 'post',
    data: {
      user_id: localUserId(),
      item_ids: normalizeInt64List(data && (data.itemIds || data.productIds || data.ids))
    }
  }).then(() => cartList())
}
const CartChecked='/cart/checked'; // 选择或取消选择商品
export function cartChecked(data) {
  const itemIds = normalizeInt64List(data && (data.itemIds || data.ids || data.selectedItemIds));
  window.localStorage.setItem('SelectedCartItemIds', itemIds.join(','));
  return {
    data: {
      errno: 0,
      errmsg: 'success',
      data: true
    }
  };
}
const CartGoodsCount='/cart/goodscount'; // 获取购物车商品件数
export function cartGoodsCount() {
  return request({
    baseURL: '',
    url: `${ZebraCartService}/GetCart`,
    method: 'post',
    data: {
      user_id: localUserId(),
      user_coupon_id: 0
    }
  }).then(res => wrapLegacyResponse(res, (res.data.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)))
}
const CartCheckout='/cart/checkout'; // 下单前信息确认
export async function cartCheckout(query) {
  const selectedIds = selectedCartItemIds(query && (query.selectedItemIds || query.cartId));
  const preferredAddressId = Number(query && query.addressId) || 0;
  const selectedUserCouponId = Number(query && query.userCouponId) || 0;

  const [cartRes, addressRes] = await Promise.all([
    request({
      baseURL: '',
      url: `${ZebraCartService}/GetCart`,
      method: 'post',
      data: {
        user_id: localUserId(),
        user_coupon_id: selectedUserCouponId
      }
    }),
    request({
      baseURL: '',
      url: `${ZebraMemberAddressService}/GetListByUser`,
      method: 'post',
      data: {
        user_id: localUserId()
      }
    }).catch(() => ({ data: { addresses: [] } }))
  ]);

  const cartItems = (cartRes.data.items || []).map(adaptCartItem);
  const filteredItems = selectedIds.length > 0
    ? cartItems.filter(item => selectedIds.includes(item.id))
    : cartItems;
  const skuIds = filteredItems.map(item => Number(item.skuId || item.productId || 0)).filter(item => item > 0);
  const stockRes = skuIds.length > 0
    ? await request({
      baseURL: '',
      url: `${ZebraStockService}/GetStock`,
      method: 'post',
      data: {
        sku_ids: skuIds
      }
    }).catch(() => ({ data: { stocks: [] } }))
    : { data: { stocks: [] } };
  const stockMap = new Map((stockRes.data.stocks || []).map(item => [Number(item.sku_id || item.skuId || 0), Number(item.stock_num || item.stockNum || 0)]));
  const checkoutItems = filteredItems.map(item => {
    const availableStock = stockMap.has(Number(item.skuId || item.productId || 0))
      ? Number(stockMap.get(Number(item.skuId || item.productId || 0)) || 0)
      : null;
    const stockEnough = availableStock === null ? true : availableStock >= Number(item.number || 0);
    return {
      ...item,
      availableStock,
      stockEnough
    };
  });
  const hasInsufficientStock = checkoutItems.some(item => item.stockEnough === false);

  const goodsTotalAmount = checkoutItems.reduce((sum, item) => {
    return sum + Math.round((item.price || 0) * 100) * (item.number || 0);
  }, 0);

  const addresses = addressRes.data.addresses || [];
  const checkoutAddress = defaultCheckoutAddress(addresses, preferredAddressId);
  const actualCouponId = Number(cartRes.data.applied_user_coupon_id || selectedUserCouponId || 0);

  return wrapLegacyResponse(cartRes, {
    checkedAddress: checkoutAddress ? adaptAddressForView(checkoutAddress) : null,
    checkedGoodsList: checkoutItems,
    availableCouponLength: actualCouponId > 0 ? 1 : 0,
    goodsTotalPrice: centsToYuan(goodsTotalAmount),
    freightPrice: 0,
    couponPrice: centsToYuan(cartRes.data.discount_amount || 0),
    grouponPrice: 0,
    orderTotalPrice: centsToYuan(goodsTotalAmount),
    actualPrice: centsToYuan(cartRes.data.pay_amount || goodsTotalAmount),
    addressId: checkoutAddress ? checkoutAddress.id : 0,
    cartId: selectedIds.join(','),
    couponId: actualCouponId,
    userCouponId: actualCouponId,
    hasInsufficientStock
  })
}

const CollectList='/collect/list'; //收藏列表
export function collectList(query) {
  return request({
    url: CollectList,
    method: 'get',
    params: query
  })
}
const CollectAddOrDelete='/collect/addordelete'; //添加或取消收藏
export function collectAddOrDelete(data) {
  const userId = localUserId();
  const goodsId = Number(data && data.valueId) || 0;
  return request({
    baseURL: '',
    url: `${ZebraCollectService}/CheckStatus`,
    method: 'post',
    data: {
      user_id: userId,
      goods_id: goodsId,
      sku_id: 0
    }
  }).then(async res => {
    if (res.data.collect_status === 1) {
      const listResp = await request({
        baseURL: '',
        url: `${ZebraCollectService}/List`,
        method: 'post',
        data: {
          page: 1,
          page_size: 20,
          user_id: userId,
          goods_id: goodsId,
          sku_id: 0,
          collect_status: 1
        }
      });
      const current = (listResp.data.collects || [])[0];
      if (current) {
        return request({
          baseURL: '',
          url: `${ZebraCollectService}/UpdateStatus`,
          method: 'post',
          data: {
            id: current.id,
            collect_status: 0
          }
        });
      }
    }
    return request({
      baseURL: '',
      url: `${ZebraCollectService}/Create`,
      method: 'post',
      data: {
        user_id: userId,
        goods_id: goodsId,
        sku_id: 0
      }
    });
  }).then(res => wrapLegacyResponse(res, true))
}
const CommentList='/comment/list'; //评论列表
const CommentCount='/comment/count'; //评论总数
const CommentPost='/comment/post'; //发表评论

const TopicList='/topic/list'; //专题列表
export function topicList(query) {
  const page = Number(query && query.page) || 1;
  const limit = Number(query && query.limit) || 10;
  return request({
    baseURL: '',
    url: `${ZebraTopicService}/ListTopic`,
    method: 'post',
    data: {
      page,
      page_size: limit,
      status: 1
    }
  }).then(res => {
    const payload = res.data || {};
    const total = Number(payload.total || 0);
    return wrapLegacyResponse(res, {
      list: (payload.topics || []).map(adaptTopicListItem),
      page,
      limit,
      pages: limit > 0 ? Math.ceil(total / limit) : 0,
      total
    });
  }).catch(() => wrapLegacyResponse({}, {
    list: [],
    page,
    limit,
    pages: 0,
    total: 0
  }));
}
const TopicDetail='/topic/detail'; //专题详情
export function topicDetail(query) {
  const id = Number(query && query.id) || 0;
  return request({
    baseURL: '',
    url: `${ZebraTopicService}/GetTopic`,
    method: 'post',
    data: { id }
  }).then(res => {
    const payload = res.data || {};
    return wrapLegacyResponse(res, {
      topic: {
        id: payload.topic && payload.topic.id ? payload.topic.id : id,
        title: payload.topic && payload.topic.title ? payload.topic.title : '',
        subtitle: payload.topic && payload.topic.subtitle ? payload.topic.subtitle : '',
        picUrl: payload.topic && payload.topic.pic_url ? payload.topic.pic_url : '',
        content: payload.topic && payload.topic.content ? payload.topic.content : '',
        readCount: payload.topic && payload.topic.read_count ? payload.topic.read_count : 0
      },
      goods: (payload.goods || []).map(item => ({
        id: item.id,
        picUrl: item.pic_url || '',
        name: item.name || '',
        retailPrice: centsToYuan(item.retail_price || 0)
      }))
    });
  }).catch(() => wrapLegacyResponse({}, {
    topic: {
      id,
      title: '',
      subtitle: '',
      content: ''
    },
    goods: []
  }));
}
const TopicRelated='/topic/related'; //相关专题
export function topicRelated(query) {
  const id = Number(query && query.id) || 0;
  const limit = Number(query && query.limit) || 4;
  return request({
    baseURL: '',
    url: `${ZebraTopicService}/GetRelatedTopic`,
    method: 'post',
    data: {
      id,
      limit
    }
  }).then(res => {
    const payload = res.data || {};
    return wrapLegacyResponse(res, (payload.topics || []).map(adaptTopicListItem));
  }).catch(() => wrapLegacyResponse({}, []));
}

const SearchIndex='/search/index'; //搜索关键字
const SearchResult='/search/result'; //搜索结果
const SearchHelper='/search/helper'; //搜索帮助
const SearchClearHistory='/search/clearhistory'; //搜索历史清楚

const AfterSalesList='/after_sales/list'; //售后列表
export function afterSalesList(query) {
  const page = Number(query && query.page) || 1;
  const limit = Number(query && query.limit) || 10;
  const salesStatus = query && typeof query.salesStatus !== 'undefined'
    ? Number(query.salesStatus)
    : -1;
  return request({
    baseURL: '',
    url: `${ZebraAfterSalesService}/GetUserAfterSales`,
    method: 'post',
    data: {
      user_id: localUserId(),
      sales_status: salesStatus,
      page,
      page_size: limit
    }
  }).then(async res => {
    const salesList = res.data.after_sales_list || [];
    const detailResp = await Promise.all(salesList.map(item => request({
      baseURL: '',
      url: `${ZebraAfterSalesService}/GetAfterSales`,
      method: 'post',
      data: {
        sales_no: item.sales_no
      }
    }).catch(() => ({ data: { after_sales: item, items: [] } }))));
    const list = salesList.map((item, index) => {
      const detail = detailResp[index] || {};
      const afterSales = detail.data && detail.data.after_sales ? detail.data.after_sales : item;
      const firstItem = (detail.data && detail.data.items && detail.data.items[0]) || null;
      return {
        id: afterSales.sales_id || afterSales.id || index,
        salesNo: afterSales.sales_no || '',
        orderNo: afterSales.order_no || '',
        status: afterSales.sales_status,
        statusText: afterSalesStatusText(afterSales.sales_status),
        refundAmount: centsToYuan(afterSales.refund_amount || 0),
        desc: afterSales.sales_desc || '',
        firstItem: firstItem ? {
          itemId: firstItem.item_id,
          skuName: firstItem.sku_name || '',
          quantity: firstItem.quantity || 0,
          refundAmount: centsToYuan(firstItem.refund_amount || 0)
        } : null
      };
    });
    return wrapLegacyResponse(res, {
      list,
      page,
      limit,
      total: res.data.total || 0,
      pages: Math.ceil((res.data.total || 0) / limit)
    });
  })
}

function afterSalesStatusText(status) {
  switch (Number(status)) {
    case 0:
      return '待审核';
    case 1:
      return '审核通过';
    case 2:
      return '审核拒绝';
    case 3:
      return '退款中';
    case 4:
      return '退款完成';
    case 5:
      return '已关闭';
    default:
      return '未知状态';
  }
}

const AddressList='/address/list'; //收货地址列表
export function addressList(query) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAddressService}/GetListByUser`,
    method: 'post',
    data: {
      user_id: localUserId()
    }
  }).then(res => wrapLegacyResponse(res, {
    list: (res.data.addresses || []).map(adaptAddressForView)
  }))
}

const AddressDetail='/address/detail'; //收货地址详情
export function addressDetail(query) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAddressService}/Get`,
    method: 'post',
    data: {
      id: Number(query && query.id) || 0
    }
  }).then(res => wrapLegacyResponse(res, adaptAddressForView(res.data.member_address || {})))
}
const AddressSave='/address/save'; //保存收货地址
export function addressSave(data) {
  const payload = {
    receiver_name: data.name || '',
    receiver_phone: data.tel || '',
    postal_code: data.postalCode || '',
    country: data.country || '中国',
    province: data.province || '',
    city: data.city || '',
    region: data.county || data.region || '',
    street: data.addressDetail || '',
    address_status: 1,
    default_option: data.isDefault ? 1 : 0
  };
  const addressId = Number(data.id) || 0;
  if (addressId > 0) {
    return request({
      baseURL: '',
      url: `${ZebraMemberAddressService}/Update`,
      method: 'post',
      data: Object.assign({ id: addressId }, payload)
    }).then(res => wrapLegacyResponse(res, true))
  }
  return request({
    baseURL: '',
    url: `${ZebraMemberAddressService}/Create`,
    method: 'post',
    data: Object.assign({ user_id: localUserId() }, payload)
  }).then(res => wrapLegacyResponse(res, true))
}
const AddressDelete='/address/delete'; //保存收货地址
export function addressDelete(data) {
  return request({
    baseURL: '',
    url: `${ZebraMemberAddressService}/Delete`,
    method: 'post',
    data: {
      id: Number(data && data.id) || 0
    }
  }).then(res => wrapLegacyResponse(res, true))
}

const ExpressQuery='/express/query'; //物流查询

const OrderSubmit='/order/submit'; // 提交订单
export async function orderSubmit(data) {
  const addressId = Number(data && data.addressId) || 0;
  const couponId = Number(data && (data.userCouponId || data.couponId)) || 0;
  const selectedItemIds = selectedCartItemIds(data && (data.selectedItemIds || data.cartId));
  const addressRes = await request({
    baseURL: '',
    url: `${ZebraMemberAddressService}/Get`,
    method: 'post',
    data: {
      id: addressId
    }
  });
  const address = addressRes.data.member_address || {};
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/CreateOrder`,
    method: 'post',
    data: {
      user_id: localUserId(),
      coupon_id: couponId,
      activity_id: 0,
      receiver_name: address.receiver_name || '',
      receiver_phone: address.receiver_phone || '',
      receiver_address: buildAddressText(address),
      selected_item_ids: selectedItemIds
    }
  }).then(res => wrapLegacyResponse(res, {
    orderId: res.data.order ? res.data.order.order_id : 0
  }))
}
const OrderPrepay='/order/prepay'; // 订单的预支付会话
export function orderPrepay(data) {
  return orderH5pay({
    orderId: data.orderId,
    payType: 2
  })
}
const OrderH5pay = '/order/h5pay'; // h5支付
export async function orderH5pay(data) {
  const orderData = await fetchOrderDetailById(data && data.orderId);
  const order = orderData.order || {};
  const payType = Number(data && data.payType) || 2;
  return request({
    baseURL: '',
    url: `${ZebraPaymentService}/CreatePayment`,
    method: 'post',
    data: {
      order_no: order.order_no,
      user_id: localUserId(),
      pay_amount: order.pay_amount || 0,
      pay_type: payType,
      notify_url: '',
      return_url: ''
    }
  }).then(res => wrapLegacyResponse(res, {
    payId: res.data.payment ? res.data.payment.pay_id : 0,
    payNo: res.data.payment ? res.data.payment.pay_no : '',
    mwebUrl: res.data.pay_url || '',
    payUrl: res.data.pay_url || ''
  }));
}
export const OrderList='/order/list'; //订单列表
export function orderList(query) {
  const page = Number(query && query.page) || 1;
  const limit = Number(query && query.limit) || 10;
  const showType = Number(query && query.showType);
  let orderStatus = -1;
  if (showType === 1) {
    orderStatus = 0;
  } else if (showType === 2) {
    orderStatus = 1;
  } else if (showType === 3) {
    orderStatus = 2;
  } else if (showType === 4) {
    orderStatus = 3;
  }
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/GetUserOrders`,
    method: 'post',
    data: {
      user_id: localUserId(),
      order_status: orderStatus,
      page,
      page_size: limit
    }
  }).then(async res => {
    const orders = res.data.orders || [];
    const detailResp = await Promise.all(orders.map(order => fetchOrderDetailById(order.order_id).catch(() => ({ order, items: [] }))));
    const list = orders.map((order, index) => {
      const detail = detailResp[index] || {};
      const items = detail.items || [];
      const orderInfo = adaptOrderInfo(order, items, detail.delivery || null);
      return {
        id: orderInfo.id,
        orderSn: orderInfo.orderSn,
        orderStatusText: orderInfo.orderStatusText,
        handleOption: orderInfo.handleOption,
        goodsList: orderInfo.orderGoods,
        actualPrice: orderInfo.actualPrice,
        post_fee: orderInfo.freightPrice
      };
    });
    return wrapLegacyResponse(res, {
      list,
      page,
      limit,
      total: res.data.total || 0,
      pages: Math.ceil((res.data.total || 0) / limit)
    });
  })
}
const OrderDetail='/order/detail'; //订单详情
export function orderDetail(query) {
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/GetOrder`,
    method: 'post',
    data: {
      order_id: Number(query && query.orderId) || 0
    }
  }).then(res => {
    const order = res.data.order || {};
    const items = res.data.items || [];
    const delivery = res.data.delivery || null;
    const orderInfo = adaptOrderInfo(order, items, delivery);
    return wrapLegacyResponse(res, {
      orderInfo,
      orderGoods: orderInfo.orderGoods,
      expressInfo: delivery ? {
        shipChannel: delivery.delivery_comp || '',
        shipSn: delivery.delivery_no || ''
      } : {}
    });
  })
}
const OrderCancel='/order/cancel'; //取消订单
export function orderCancel(data) {
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/CancelOrder`,
    method: 'post',
    data: {
      order_no: data.orderNo,
      user_id: localUserId()
    }
  }).then(res => wrapLegacyResponse(res, true))
}
const OrderRefund='/order/refund'; //退款取消订单
export function orderRefund(data) {
  return fetchOrderDetailById(data.orderId).then(orderData => {
    const order = orderData.order || {};
    const items = orderData.items || [];
    return request({
      baseURL: '',
      url: `${ZebraAfterSalesService}/CreateAfterSales`,
      method: 'post',
      data: {
        order_no: order.order_no || '',
        user_id: localUserId(),
        sales_type: 1,
        sales_reason: 4,
        sales_desc: '用户申请退款',
        order_item_ids: items.map(item => item.item_id).filter(itemId => itemId > 0)
      }
    });
  }).then(res => wrapLegacyResponse(res, true))
}
const OrderDelete='/order/delete'; //删除订单
export function orderDelete(data) {
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/DeleteOrder`,
    method: 'post',
    data: {
      order_no: data.orderNo || data.orderSn || '',
      user_id: localUserId()
    }
  }).then(res => wrapLegacyResponse(res, true))
}
const OrderConfirm='/order/confirm'; //确认收货
export function orderConfirm(data) {
  return request({
    baseURL: '',
    url: `${ZebraOrderService}/FinishOrder`,
    method: 'post',
    data: {
      order_no: data.orderNo
    }
  }).then(res => wrapLegacyResponse(res, true))
}
const OrderGoods='/order/goods'; // 代评价商品信息
const OrderComment='/order/comment'; // 评价订单商品信息

const FeedbackAdd='/feedback/submit'; //添加反馈
export function feedbackAdd(data) {
  return request({
    url: FeedbackAdd,
    method: 'post',
    data
  })
}

const FootprintList='/footprint/list'; //足迹列表
const FootprintDelete='/footprint/delete'; //删除足迹

const GrouponList='/groupon/list'; //团购列表
export function grouponList(query) {
  return request({
    url: GrouponList,
    method: 'get',
    params: query
  })
}
const GroupOn='/groupon/query'; //团购API-查询
const GroupOnMy='/groupon/my'; //团购API-我的团购
const GroupOnDetail='/groupon/detail'; //团购API-详情
const GroupOnJoin='/groupon/join'; //团购API-详情

const CouponList='/coupon/list'; //优惠券列表
export function couponList(query) {
  return request({
    url: CouponList,
    method: 'get',
    params: query
  })
}
export const CouponMyList='/coupon/mylist'; //我的优惠券列表
export function couponMyList(query) {
  return request({
    url: CouponMyList,
    method: 'get',
    params: query
  })
}
const CouponSelectList='/coupon/selectlist'; //当前订单可用优惠券列表
export async function couponSelectList(query) {
  const cartRes = await request({
    baseURL: '',
    url: `${ZebraCartService}/GetCart`,
    method: 'post',
    data: {
      user_id: localUserId(),
      user_coupon_id: 0
    }
  });
  const orderAmount = cartRes.data.total_amount || 0;
  const availableRes = await request({
    baseURL: '',
    url: `${ZebraUserCouponService}/GetAvailable`,
    method: 'post',
    data: {
      user_id: localUserId(),
      order_amount: orderAmount
    }
  });
  const userCoupons = availableRes.data.user_coupons || [];
  const couponDetails = await Promise.all(userCoupons.map(item => request({
    baseURL: '',
    url: `${ZebraCouponService}/Get`,
    method: 'post',
    data: {
      id: item.coupon_id
    }
  }).catch(() => ({ data: { coupon: {} } }))));
  const list = userCoupons.map((item, index) => {
    const coupon = (couponDetails[index] && couponDetails[index].data && couponDetails[index].data.coupon) || {};
    const available = item.coupon_status === 0;
    return {
      id: item.user_coupon_id,
      cid: item.coupon_id,
      name: coupon.name || item.coupon_no || '优惠券',
      min: centsToYuan(coupon.min_amount || 0),
      discount: centsToYuan(coupon.discount_amount || 0),
      desc: '',
      startTime: item.start_time ? new Date(item.start_time * 1000).toISOString() : '',
      endTime: item.end_time ? new Date(item.end_time * 1000).toISOString() : '',
      available
    };
  });
  return wrapLegacyResponse(availableRes, { list })
}
const CouponReceive='/coupon/receive'; //优惠券领取
export function couponReceive(data) {
  return request({
    baseURL: '',
    url: `${ZebraUserCouponService}/Receive`,
    method: 'post',
    data: {
      user_id: localUserId(),
      coupon_id: Number(data && (data.couponId || data.id)) || 0
    }
  }).then(res => wrapLegacyResponse(res, true))
}
const CouponExchange='/coupon/exchange'; //优惠券兑换

const StorageUpload='/storage/upload'; //图片上传,

const UserIndex='/user/index'; //个人页面用户相关信息
export async function userIndex() {
  const [allRes, unpaidRes, unshipRes, unrecvRes, finishedRes] = await Promise.all([
    request({
      baseURL: '',
      url: `${ZebraOrderService}/GetUserOrders`,
      method: 'post',
      data: { user_id: localUserId(), order_status: -1, page: 1, page_size: 1 }
    }).catch(() => ({ data: { total: 0 } })),
    request({
      baseURL: '',
      url: `${ZebraOrderService}/GetUserOrders`,
      method: 'post',
      data: { user_id: localUserId(), order_status: 0, page: 1, page_size: 1 }
    }).catch(() => ({ data: { total: 0 } })),
    request({
      baseURL: '',
      url: `${ZebraOrderService}/GetUserOrders`,
      method: 'post',
      data: { user_id: localUserId(), order_status: 1, page: 1, page_size: 1 }
    }).catch(() => ({ data: { total: 0 } })),
    request({
      baseURL: '',
      url: `${ZebraOrderService}/GetUserOrders`,
      method: 'post',
      data: { user_id: localUserId(), order_status: 2, page: 1, page_size: 1 }
    }).catch(() => ({ data: { total: 0 } })),
    request({
      baseURL: '',
      url: `${ZebraOrderService}/GetUserOrders`,
      method: 'post',
      data: { user_id: localUserId(), order_status: 3, page: 1, page_size: 1 }
    }).catch(() => ({ data: { total: 0 } }))
  ]);

  return wrapLegacyResponse(allRes, {
    order: {
      unpaid: allRes.data && unpaidRes.data ? (unpaidRes.data.total || 0) : 0,
      unship: allRes.data && unshipRes.data ? (unshipRes.data.total || 0) : 0,
      unrecv: allRes.data && unrecvRes.data ? (unrecvRes.data.total || 0) : 0,
      uncomment: allRes.data && finishedRes.data ? (finishedRes.data.total || 0) : 0,
      all: allRes.data ? (allRes.data.total || 0) : 0
    }
  })
}
export function getList(api, query) {
  return request({
    url: api,
    method: 'get',
    params: query
  })
}

export const REFUND_LIST = '';
