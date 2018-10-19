<template>
  <div>
    <h2>Vue Hamlet Demo</h2>
    <test></test>
  </div>
</template>

<script>
import Test from '@/components/Test';

export default {
  components: {
    Test,
  },
  created() {
    console.log('>>>> this:', this);
  },
};
</script>
