<template>
  <div>
    <el-input v-maxlen v-model="text" placeholder="Default 4000" />
    <el-input v-maxlen="10" v-model="shortText" placeholder="Max 10" />
    <el-input v-model="autoText" placeholder="Auto default 4000" />
    <el-input :maxlen="12" v-model="autoShort" placeholder="Auto max 12" />
  </div>
</template>

<script>
module.exports = {
  data() {
    return {
      text: "",
      shortText: "",
      autoText: "",
      autoShort: ""
    };
  }
};
</script>
