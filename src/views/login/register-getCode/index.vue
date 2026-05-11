<template>
	<md-field-group class="register_view">
		<md-field
			v-model="mobile"
			icon="mobile"
			placeholder="请输入手机号"
			@blur="validateMobile"
		/>
		<div class="field_error" v-show="mobileError">{{ mobileError }}</div>

		<md-field
			v-model="password"
			icon="lock"
			placeholder="请输入密码"
			:type="visiblePass ? 'text' : 'password'"
			:right-icon="visiblePass ? 'eye-open' : 'eye-close'"
			@right-click="visiblePass = !visiblePass"
			@input="checkPasswordStrength"
		/>
		<div class="password_tips" v-if="password">
			<div class="tip_item" :class="{ pass: rules.minLength }">至少8位</div>
			<div class="tip_item" :class="{ pass: rules.hasLetter }">包含字母</div>
			<div class="tip_item" :class="{ pass: rules.hasDigit }">包含数字</div>
		</div>

		<md-field
			v-model="repeatPassword"
			icon="lock"
			placeholder="请再次确认密码"
			:type="visibleRepeat ? 'text' : 'password'"
			:right-icon="visibleRepeat ? 'eye-open' : 'eye-close'"
			@right-click="visibleRepeat = !visibleRepeat"
		/>
		<div class="field_error" v-show="repeatError">{{ repeatError }}</div>

		<div class="register_submit">
			<van-button size="large" type="danger" @click="registerSubmit" :loading="submitting">注册</van-button>
		</div>

		<div class="register_footer">
			已有账号?
			<router-link to="/login" class="red">登录</router-link>
		</div>
	</md-field-group>
</template>

<script>
import field from '@/components/field/';
import fieldGroup from '@/components/field-group/';
import { mobileReg } from '@/utils/validate';
import { authRegister } from '@/api/api';
import { Toast } from 'vant';

export default {
  data() {
    return {
      mobile: '',
      password: '',
      repeatPassword: '',
      visiblePass: false,
      visibleRepeat: false,
      mobileError: '',
      repeatError: '',
      submitting: false,
      rules: {
        minLength: false,
        hasLetter: false,
        hasDigit: false
      }
    };
  },

  methods: {
    validateMobile() {
      if (!this.mobile) {
        this.mobileError = '请输入手机号';
        return false;
      }
      if (!mobileReg.test(this.mobile)) {
        this.mobileError = '手机号格式不正确';
        return false;
      }
      this.mobileError = '';
      return true;
    },

    checkPasswordStrength() {
      const pwd = this.password;
      this.rules.minLength = pwd.length >= 8;
      this.rules.hasLetter = /[a-zA-Z]/.test(pwd);
      this.rules.hasDigit = /[0-9]/.test(pwd);
    },

    validateForm() {
      const mobileOk = this.validateMobile();
      if (!this.password) {
        Toast.fail('请输入密码');
        return false;
      }
      if (!this.rules.minLength || !this.rules.hasLetter || !this.rules.hasDigit) {
        Toast.fail('密码需包含字母和数字，且不少于8位');
        return false;
      }
      if (!this.repeatPassword) {
        Toast.fail('请确认密码');
        return false;
      }
      if (this.password !== this.repeatPassword) {
        this.repeatError = '两次密码输入不一致';
        return false;
      }
      this.repeatError = '';
      return mobileOk;
    },

    registerSubmit() {
      if (!this.validateForm()) return;
      this.submitting = true;
      authRegister({
        mobile: this.mobile,
        password: this.password,
        repeatPassword: this.repeatPassword
      }).then(() => {
        this.$router.push({
          name: 'registerStatus',
          params: { status: 'success' }
        });
      }).catch(error => {
        const message = (error && error.data && (error.data.errmsg || error.data.msg)) || '注册失败';
        Toast.fail(message);
        if (error && error.data && error.data.errno == 705) {
          window.location = '#/login/';
        }
      }).finally(() => {
        this.submitting = false;
      });
    }
  },

  components: {
    [field.name]: field,
    [fieldGroup.name]: fieldGroup
  }
};
</script>

<style lang="scss" scoped>
div.register_view {
  background-color: #fff;
  padding-top: 30px;
}

div.register_submit {
  padding-top: 20px;
  padding-bottom: 20px;
}

.register_footer {
  text-align: right;
  color: $font-color-gray;
}

.field_error {
  color: #f44;
  font-size: 12px;
  padding: 4px 0 0 10px;
}

.password_tips {
  display: flex;
  gap: 12px;
  padding: 6px 0 4px 10px;

  .tip_item {
    font-size: 12px;
    color: #999;

    &.pass {
      color: #06bf04;
    }
  }
}
</style>
