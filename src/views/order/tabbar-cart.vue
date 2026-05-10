<template>
  <div class="tab-cart">
    <div class="editor_head" v-show="goods.length">
      <van-icon :name="isEditor ? 'success' : 'editor'"/>
      <span @click="isEditor = !isEditor">{{isEditor ? '完成' : '编辑'}}</span>
    </div>
    <van-checkbox-group @change="toggle" class="card-goods" v-model="checkedGoods">
      <div v-for="(item, i) in goods" :key="i" class="card-goods__item">
        <van-checkbox :key="item.id" :name="item.id" v-model="item.checked"></van-checkbox>

        <van-card :title="item.goodsName" :price="item.price" :num="item.number" :thumb="item.picUrl">
          <div slot="desc">
            <div class="van-card__desc">
              <van-tag plain style="margin-right:6px;" v-for="(spec, index) in item.specifications" :key="index">
                {{spec}}
              </van-tag>
            </div>
          </div>
          <div slot="footer" v-if="isEditor">
            <van-stepper v-model="item.number" @change="stepperEvent(item,arguments)" disableInput/>
          </div>
          <div slot="footer" v-else>添加日期 {{item.addTime}}</div>
        </van-card>

        <div class="cart_delete" v-if="isEditor" @click="deleteCart(i)">删除</div>
      </div>
    </van-checkbox-group>

    <is-empty v-if="!goods.length">您的购物车空空如也~</is-empty>

    <van-submit-bar
      style="bottom: 50px"
      :price="totalPrice"
      :disabled="!checkedGoods.length"
      :buttonText="submitBarText"
      :loading="isSubmit"
      label="总计"
      @submit="cartSubmit"
    >
      <van-checkbox v-model="checkedAll" @click="setCheckAll" style="padding: 0 10px;">全选</van-checkbox>
    </van-submit-bar>
  </div>
</template>

<script>
import { Checkbox, CheckboxGroup, Card, SubmitBar, Stepper, Tag } from 'vant';
import { cartList, cartUpdate, cartChecked, cartDelete} from '@/api/api';
import { setLocalStorage } from '@/utils/local-storage';

import isEmpty from '@/components/is-empty/';
import _ from 'lodash';

export default {
  data() {
    return {
      isEditor: false,
      checkedAll: false,
      isSubmit: false,
      checkedGoods: [],
      allGoods: [],
      goods: []
    };
  },
  created() {
    this.init();
  },
  computed: {
    submitBarText() {
      return this.isEditor ? '删除' : '结算';
    },
    totalPrice() {
      return this.goods.reduce(
        (total, item) =>
          total +
          (this.checkedGoods.indexOf(item.id) !== -1
            ? item.price * item.number * 100
            : 0),
        0
      );
    }
  },

  methods: {
    stepperEvent(item, arg) {
      let number = arg[0];
      cartUpdate({
        number: number,
        id: item.id
      });
    },
    init() {
      cartList().then(res => {
        this.goods = res.data.data.cartList;
        this.allGoods = this.getAllList();
        this.checkedGoods = this.getCheckedList(this.goods);
        this.checkedAll = this.checkedGoods.length === this.allGoods.length && this.allGoods.length > 0;
      });
    },
    getAllList() {
      let result = [];
      _.each(this.goods, v => {
        result.push(v.id);
      });
      return result;
    },
    getCheckedList(goods) {
      let result = [];
      _.each(goods, v => {
        if (v.checked) {
          result.push(v.id);
        }
      });
      return result;
    },
    cartSubmit(data) {
      const itemIds = [...this.checkedGoods];
      if (this.isEditor) {
        this.$dialog
          .confirm({
            message: '确定删除所选商品吗?',
            cancelButtonText: '再想想'
          })
          .then(() => {
            this.deleteNext(itemIds);
          });
      } else {
        this.isSubmit = true;
        setLocalStorage({AddressId: 0, CartId: itemIds.join(','), CouponId: 0, UserCouponId: 0, SelectedCartItemIds: itemIds.join(',')});
        this.$router.push('/order/checkout');
      }
    },
    setCheckAll(val) {
      if (this.checkedGoods.length === this.allGoods.length) {
        this.checkedGoods = [];
      } else {
        this.checkedGoods = this.allGoods;
      }
    },
    deleteCart(o) {
      let itemId = this.goods[o].id;
      this.$dialog
        .confirm({ message: '确定删除所选商品吗', cancelButtonText: '再想想' })
        .then(() => {
          this.$nextTick(() => {
            this.deleteNext(itemId);
          });
        });
    },
    toggle(index) {
      cartChecked({ itemIds: index });
      this.checkedAll = index.length === this.allGoods.length && this.allGoods.length > 0;
    },
    deleteNext(o) {
      let itemIds = [];
      if (o instanceof Array) {
        itemIds = o;
      } else {
        itemIds.push(o);
      }

      cartDelete({itemIds: itemIds}).then(res => {
        this.goods = res.data.data.cartList;
        this.allGoods = this.getAllList();
        this.checkedGoods = this.getCheckedList(this.goods);
        this.checkedAll = this.checkedGoods.length === this.allGoods.length && this.allGoods.length > 0;
      });
    }
  },

  components: {
    [Card.name]: Card,
    [Tag.name]: Tag,
    [Stepper.name]: Stepper,
    [isEmpty.name]: isEmpty,
    [Checkbox.name]: Checkbox,
    [SubmitBar.name]: SubmitBar,
    [CheckboxGroup.name]: CheckboxGroup
  }
};
</script>


<style lang="scss" scoped>
@import '../../assets/scss/mixin';

.tab-cart {
  padding-bottom: 50px;
  box-sizing: border-box;
}

.editor_head {
  @include one-border;
  text-align: right;
  padding: 10px;
  font-size: $font-size-normal;
  background-color: #fff;
}

.card-goods {
  background-color: $bg-color;
  .card-goods__item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    background-color: #fff;
  }
  .cart_delete {
    line-height: 100px;
    padding: 0 10px;
    color: #fff;
    background-color: $red;
  }
  .card-goods__footer {
    font-size: $font-size-normal;
    color: $font-color-gray;
  }
}

.clear_invalid {
  width: 120px;
  color: $font-color-gray;
  border: 1px solid $font-color-gray;
  margin: 0 auto;
  text-align: center;
  padding: 5px 3px;
  margin-top: 20px;
  border-radius: 3px;
}
</style>
