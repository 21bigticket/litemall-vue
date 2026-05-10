<template>
  <div class="goods_topic">
    <div class="topic-detail"
         v-html="topic.content">
    </div>

    <van-row gutter>
      <van-col span="12"
               v-for="(goods ,index) in topicGoods"
               :key="index">
        <router-link :to="{ path: `/items/detail/${goods.id}`}">
          <img :src="goods.picUrl"
               style="width:150px;height:150px;">
        </router-link>
        <div style="margin-left: 20px; rgb(123, 116, 116);">{{goods.name}}</div>
        <div style="margin-left: 20px; color:#ab956d">￥ {{goods.retailPrice}}</div>
      </van-col>
    </van-row>

    <div class="related-title" v-if="topicRelated.length > 0">相关专题</div>
    <div class="related-list" v-if="topicRelated.length > 0">
      <router-link
        v-for="related in topicRelated"
        :key="related.id"
        :to="{ path: `/items/topic/${related.id}` }"
        class="related-item"
      >
        <img class="related-img" :src="related.picUrl" />
        <div class="related-meta">
          <div class="related-name">{{ related.title }}</div>
          <div class="related-subtitle">{{ related.subtitle }}</div>
        </div>
      </router-link>
    </div>

  </div>
</template>

<script>
import { topicDetail, topicRelated } from '@/api/api';
import { Card, Row, Col } from 'vant';

export default {
  props: {
    topicId: [String, Number]
  },
  data() {
    return {
      topic: {},
      topicGoods: [],
      topicRelated: []
    };
  },

  created() {
    this.init();
  },

  methods: {
    init() {
      topicDetail({
        id: this.topicId
      }).then(res => {
        this.topic = res.data.data.topic;
        this.topicGoods = res.data.data.goods;
      }).catch(() => {
        this.topic = {
          content: ''
        };
        this.topicGoods = [];
      });

      topicRelated({
        id: this.topicId
      }).then(res => {
        this.topicRelated = res.data.data;
      }).catch(() => {
        this.topicRelated = [];
      });
    },
    itemClick(id) {
      this.$router.push(`/items/detail/${id}`);
    }
  },

  components: {
    [Card.name]: Card,
    [Row.name]: Row,
    [Col.name]: Col
  }
};
</script>

<style lang="scss" scoped>
.goods_topic {
  .topic-detail {
    ::v-deep p {
      padding: 0 10px;
      margin-block-start: 0 !important;
      margin-block-end: 0 !important;
    }
    ::v-deep img {
      max-width: 100%;
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
  }

  .related-title {
    margin: 24px 16px 12px;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .related-list {
    padding: 0 16px 24px;

    .related-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      color: inherit;
    }

    .related-img {
      width: 96px;
      height: 96px;
      border-radius: 8px;
      object-fit: cover;
      margin-right: 12px;
      background: #f7f7f7;
    }

    .related-meta {
      flex: 1;
      min-width: 0;
    }

    .related-name {
      font-size: 16px;
      color: #222;
      line-height: 1.4;
      margin-bottom: 6px;
    }

    .related-subtitle {
      font-size: 13px;
      color: #888;
      line-height: 1.5;
    }
  }
}
</style>
