<template>
	<div class="login">
    	<div class="store_header">
		<div class="store_avatar">
			<img src="../../assets/images/avatar_default.png" alt="头像" width="55" height="55">
		</div>
		<div class="store_name">litemall-vue</div>
	</div>

    <md-field-group>
      <md-field
        v-model="account"
        icon="mobile"
        placeholder="请输入手机号"
        right-icon="clear-full"
        name="user"
        data-vv-as="帐号"
        @right-click="clearText"
        @blur="validateAccount"
      />
      <div class="field_error" v-show="accountError">{{ accountError }}</div>

      <md-field
        v-model="password"
        icon="lock"
        placeholder="请输入密码"
        :type="visiblePass ? 'text' : 'password'"
        :right-icon="visiblePass ? 'eye-open' : 'eye-close'"
        data-vv-as="密码"
        name="password"
        @right-click="visiblePass = !visiblePass"
      />
      <div class="field_error" v-show="passwordError">{{ passwordError }}</div>

      <div class="clearfix">
        <div class="float-l">
          <router-link to="/login/register">免费注册</router-link>
        </div>
        <div class="float-r">
          <router-link to="/login/forget">忘记密码</router-link>
        </div>
      </div>

      <van-button size="large" type="danger" :loading="isLogining" @click="loginSubmit">登录</van-button>
    </md-field-group>


      <div class="text-desc text-center bottom_positon">技术支持: litemall</div>

	</div>
</template>

<script>
import field from '@/components/field/';
import fieldGroup from '@/components/field-group/';

import { authLoginByAccount } from '@/api/api';
import { setLocalStorage } from '@/utils/local-storage';
import { mobileReg } from '@/utils/validate';

import { Toast } from 'vant';


export default {
  name: 'login-request',
  components: {
    [field.name]: field,
    [fieldGroup.name]: fieldGroup,
    Toast
  },
  data() {
    return {
      account: '',
      password: '',
      visiblePass: false,
      isLogining: false,
      accountError: '',
      passwordError: '',
      userInfo: {}
    };
  },

  methods: {
    clearText() {
      this.account = '';
    },

    validateAccount() {
      if (!this.account) {
        this.accountError = '请输入手机号';
        return false;
      }
      if (!mobileReg.test(this.account)) {
        this.accountError = '手机号格式不正确';
        return false;
      }
      this.accountError = '';
      return true;
    },

    validatePassword() {
      if (!this.password) {
        this.passwordError = '请输入密码';
        return false;
      }
      this.passwordError = '';
      return true;
    },

    validate() {
      const accountOk = this.validateAccount();
      const passwordOk = this.validatePassword();
      return accountOk && passwordOk;
    },

    login() {
      let loginData = this.getLoginData();
      authLoginByAccount(loginData).then(res => {
        this.userInfo = res.data.data.userInfo;
        setLocalStorage({
          Authorization: res.data.data.token,
          userId: this.userInfo.userId,
          userName: this.userInfo.userName,
          avatar: this.userInfo.avatarUrl,
          nickName: this.userInfo.nickName,
          mobile: this.userInfo.mobile || '',
          email: this.userInfo.email || ''
        });

        this.routerRedirect();
      }).catch(error => {
        const message = (error && error.data && (error.data.errmsg || error.data.msg)) || '登录失败';
        Toast.fail(message);
      });
    },

    loginSubmit() {
      if (!this.validate()) return;
      this.isLogining = true;
      this.login();
      this.isLogining = false;
    },

    routerRedirect() {
      window.location = '#/user/';
    },

    getLoginData() {
      return {
        mobile: this.account,
        password: this.password
      };
    }
  }
};
</script>


<style lang="scss" scoped>
@import '../../assets/scss/mixin';
.login {
  position: relative;
  background-color: #fff;
}
.store_header {
  text-align: center;
  padding: 30px 0;
  .store_avatar img {
    border-radius: 50%;
  }
  .store_name {
    padding-top: 5px;
    font-size: 16px;
  }
}
.register {
  padding-top: 40px;
  color: $font-color-gray;
  a {
    color: $font-color-gray;
  }
  > div {
    width: 50%;
    box-sizing: border-box;
    padding: 0 20px;
  }
  .connect {
    @include one-border(right);
    text-align: right;
  }
}
.bottom_positon {
  position: absolute;
  bottom: 30px;
  width: 100%;
}
.field_error {
  color: #f44;
  font-size: 12px;
  padding: 4px 0 0 10px;
}
</style>
