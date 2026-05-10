<template>
  <div class="refund_list">
    <van-tabs sticky :active="activeIndex" :swipe-threshold="6" @click="handleTabClick">
      <van-tab v-for="(tab, tabIndex) in tabsItem" :title="tab.name" :key="tabIndex">
        <van-list
          v-model="loading"
          :finished="finished"
          :immediate-check="false"
          finished-text="没有更多了"
          @load="getRefundList"
        >
          <van-panel
            v-for="(el, i) in list"
            class="refund_list--panel"
            :key="el.id || i"
            :title="'售后单号: ' + el.salesNo"
            :status="el.statusText"
          >
            <div class="refund_list--content">
              <div class="refund_list--line">订单编号: {{ el.orderNo }}</div>
              <div class="refund_list--line">退款金额: {{ el.refundAmount | yuan }}</div>
              <div class="refund_list--line" v-if="el.desc">说明: {{ el.desc }}</div>
              <van-card
                v-if="el.firstItem"
                class="refund_list--van-card"
                :title="el.firstItem.skuName"
                :num="el.firstItem.quantity"
                :price="el.firstItem.refundAmount.toFixed(2)"
                :thumb="''"
              />
            </div>
            <div slot="footer" style="text-align: right;">
              <van-button size="small" @click="showDetail(el)">查看详情</van-button>
            </div>
          </van-panel>
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
import { afterSalesList } from '@/api/api';
import { Tab, Tabs, Panel, Card, List, Button } from 'vant';

const TAB_DEFS = [
  { name: '全部', status: -1 },
  { name: '待审核', status: 0 },
  { name: '退款中', status: 3 },
  { name: '退款完成', status: 4 }
];

export default {
  name: 'refund-list',

  data() {
    return {
      activeIndex: 0,
      list: [],
      page: 0,
      limit: 10,
      loading: false,
      finished: false,
      tabsItem: TAB_DEFS
    };
  },

  created() {
    this.init();
  },

  methods: {
    init() {
      this.page = 0;
      this.list = [];
      this.loading = false;
      this.finished = false;
      this.getRefundList();
    },
    handleTabClick(index) {
      if (this.activeIndex !== index) {
        this.activeIndex = index;
        this.init();
      }
    },
    getRefundList() {
      this.page += 1;
      const currentTab = this.tabsItem[this.activeIndex] || TAB_DEFS[0];
      afterSalesList({
        page: this.page,
        limit: this.limit,
        salesStatus: currentTab.status
      }).then(res => {
        this.list.push(...res.data.data.list);
        this.loading = false;
        this.finished = res.data.data.page >= res.data.data.pages;
      }).catch(() => {
        this.loading = false;
        this.finished = true;
      });
    },
    showDetail(item) {
      const lines = [
        `售后单号: ${item.salesNo || ''}`,
        `订单编号: ${item.orderNo || ''}`,
        `状态: ${item.statusText || ''}`,
        `退款金额: ${item.refundAmount || 0}`,
        item.desc ? `说明: ${item.desc}` : ''
      ].filter(Boolean);
      this.$dialog.alert({
        message: lines.join('\n')
      });
    }
  },
  components: {
    [Tab.name]: Tab,
    [Tabs.name]: Tabs,
    [Panel.name]: Panel,
    [Card.name]: Card,
    [List.name]: List,
    [Button.name]: Button
  }
};
</script>

<style lang="scss" scoped>
.refund_list {
  padding-bottom: 0;

  &--panel {
    margin-bottom: 10px;
  }

  &--content {
    padding: 12px 16px;
  }

  &--line {
    line-height: 24px;
    color: #666;
    font-size: 14px;
  }

  &--van-card {
    margin-top: 10px;
    background-color: #fafafa;
  }
}
</style>
