let refresherInstance = null;

const ReRenderer = {
  initRenderer: (refresher) => {
    typeof refresher === "function" &&
      refresherInstance === null &&
      (refresherInstance = refresher);
  },

  render: () => {
    refresherInstance && refresherInstance();

    console.log("=== refresherInstance === reRenderer.js === key: 042303 ===");
    console.dir(refresherInstance, { depth: null, colors: true });
    console.log("=================================");
  },
  reload: () => {
    window.location.reload();
  },
};

export default ReRenderer;
