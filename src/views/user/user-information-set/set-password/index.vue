<template>
  <div>
    <van-cell-group>

      <van-field
        label="手机号码"
        v-model="mobile"
        placeholder="请输入手机号码"
      />

			<van-field
				label="验证码"
				v-model="code"
				@click-icon="getCode"
				placeholder="请输入验证码">

				<span slot="button"
					class="verifi_code red"
					:class="{verifi_code_counting: counting}"
					@click="getCode">
					<countdown v-if="counting" :time="60000" @end="countdownend">
					  <template slot-scope="props">{{ +props.seconds || 60 }}秒后获取</template>
					</countdown>
					<span v-else>获取验证码</span>
				</span>
			</van-field>

      <van-field
        label="新密码"
        v-model="password"
        type="password"
        placeholder="请输入新密码"
      />

      <van-field
        label="确认密码"
        v-model="password2"
        type="password"
        placeholder="请再次输入密码"
      />

    </van-cell-group>

    <div class="bottom_btn">
      <van-button size="large" type="danger" @click="modifypassword">保存</van-button>
    </div>
  </div>
</template>


<script>
import { authCaptcha, authInfo, authReset } from '@/api/api';
import { removeLocalStorage } from '@/utils/local-storage';
import { Field, Toast } from 'vant';

export default {
  data: () => ({
    password: '',
    password2: '',
    mobile: '',
    code: '',
    counting: false
  }),

  created() {
    this.loadProfile();
  },

  methods: {
    loadProfile() {
      authInfo().then(res => {
        const info = (res && res.data && res.data.data) || {};
        this.mobile = info.mobile || '';
      }).catch(() => {});
    },
    modifypassword() {
      if (this.passwordValid()) {
        authReset({
          password: this.password,
          repeatPassword: this.password2,
          mobile: this.mobile,
          code: this.code
        })
        .then(() => {
          this.$dialog.alert({ message: '保存成功, 请重新登录.' }).then(() => {
            removeLocalStorage('Authorization', 'userId', 'userName', 'avatar', 'nickName', 'mobile', 'email');
            this.$router.replace({ name: 'login' });
          });
        }).catch (error => {
          const message = (error && error.data && (error.data.errmsg || error.data.msg)) || '保存失败';
          Toast.fail(message);
        });
      }
    },
    passwordValid() {
      if (!this.mobile) {
        Toast.fail('请输入手机号');
        return false;
      }
      if (!this.code) {
        Toast.fail('请输入验证码');
        return false;
      }
      if (!this.password) {
        Toast.fail('请输入新密码');
        return false;
      }
      if (this.password !== this.password2) {
        Toast.fail('两次密码输入不一致');
        return false;
      }
      return true;
    },
    getCode() {
      if(this.mobile === ''){
        this.$toast.fail('请输入号码');
        return
      }

      if (!this.counting) {
        authCaptcha({
          mobile: this.mobile,
          type: 'change-password'
        }).then(() => {
          this.$toast.success('发送成功');
          this.counting = true;
        }).catch(error => {
          this.$toast.fail(error.data.errmsg);
          this.counting = false;
        })

      }
    },
    countdownend() {
      this.counting = false;
    }
  },

  components: {
    [Field.name]: Field
  }
};
</script>


<style lang="scss" scoped>
@import '../../../../assets/scss/var';
@import '../../../../assets/scss/mixin';
.bottom_btn {
  padding: 30px 15px 0 15px;
}

.verifi_code {
  @include one-border;
  padding-left: 10px;
  &::after {
    border-bottom: 0;
    border-left: 1px solid $border-color;
  }

  &_counting {
    color: $font-color-gray;
  }
}
</style>
