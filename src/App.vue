<template>
  <div>
    <el-input v-maxlen v-model="text" placeholder="Default 4000" />
    <el-input v-maxlen="10" v-model="shortText" placeholder="Max 10" />
    <el-input v-model="autoText" placeholder="Auto default 10" />
    <el-input :maxlen="12" v-model="autoShort" placeholder="Auto max 12" />
    <el-input2 v-model="overrideText" placeholder="Override default 4000" />
    <el-input2
      :maxlength="8"
      v-model="overrideShort"
      placeholder="Override max 8"
    />
    <el-input2
      :maxlength="0"
      v-model="overrideDisabled"
      placeholder="Override disabled"
    />
    <el-input2
      type="textarea"
      v-model="overrideTextarea"
      placeholder="Override textarea"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      text: "",
      shortText: "",
      autoText: "",
      autoShort: "",
      overrideText: "",
      overrideShort: "",
      overrideDisabled: "",
      overrideTextarea: ""
    };
  }
};
</script>
