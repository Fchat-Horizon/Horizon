(() => {
  const saveRecords = (records, iteration, startTime) => {
    return new Promise((resolve, reject) => {
      const jsonStr = JSON.stringify(records);
      console.log(
        `Iteration ${iteration}, saving ${records.length} records, taking ${jsonStr.length} characters, at ${(Date.now() - startTime) / 1000}s`
      );

      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a');
      const d = new Date();

      el.href = url;
      el.download = `flist-profile-cache-${d.toISOString()}-${iteration}.json`;

      document.body.appendChild(el);

      el.click();

      setTimeout(() => {
        document.body.removeChild(el);
        window.URL.revokeObjectURL(url);

        resolve();
      }, 0);
    });
  };

  const conn = indexedDB.open('flist-ascending-profiles', 1);

  conn.onsuccess = e => {
    const db = e.target.result;

    function getRecords(iteration, recordLimit, startTime) {
      return new Promise((resolve, reject) => {
        const txn = db.transaction('profiles', 'readonly');
        const store = txn.objectStore('profiles');

        const cursorReq = store.openCursor();
        const records = [];

        let hasAdvanced = false;

        cursorReq.onsuccess = ce => {
          const cursor = ce.target.result;

          if (!cursor) {
            if (records.length > 0) {
              saveRecords(records, iteration, startTime).then(() => resolve(false));
            }

            resolve(false);
            return;
          }

          if (iteration > 0 && hasAdvanced === false) {
            console.log(`Advancing ${iteration * recordLimit} records`);
            hasAdvanced = true;
            cursor.advance(iteration * recordLimit);
            return;
          }

          records.push(cursor.value);

          if (records.length >= recordLimit) {
            saveRecords(records, iteration, startTime).then(() => resolve(true));

            txn.abort();
            return;
          }

          cursor.continue();
        };
      });
    }

    let iteration = 0;
    const recordLimit = 2500;
    const startTime = Date.now();

    const getRecordsManager = async shouldContinue => {
      if (!shouldContinue) {
        console.log('Export Completed');
        return;
      }

      iteration++;

      const result = await getRecords(iteration, recordLimit, startTime);

      return getRecordsManager(result);
    };

    getRecords(iteration, recordLimit, startTime).then(shouldContinue => getRecordsManager(shouldContinue));
  };
})();
