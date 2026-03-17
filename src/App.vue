<template>
  <div>
    <el-input v-maxlen v-model="text" placeholder="Default 4000" />
    <el-input v-maxlen="10" v-model="shortText" placeholder="Max 10" />
  </div>
</template>

<script>
module.exports = {
  data() {
    return {
      text: "",
      shortText: ""
    };
  }
};
</script>
