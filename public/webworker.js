const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));

onmessage = (e) => {
  const { num } = e.data;
//   const startTime = new Date().getTime();
let res=new Array(num).fill(0)
//   const fibNum = fib(num);
  postMessage({
    res,
    // time: new Date().getTime() - startTime,
  });
};

