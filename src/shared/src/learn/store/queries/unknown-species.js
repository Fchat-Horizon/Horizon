(() => {
  const conn = indexedDB.open('flist-ascending-profiles', 1);

  conn.onsuccess = e => {
    const db = e.target.result;
    const txn = db.transaction('profiles', 'readonly');
    const store = txn.objectStore('profiles');
    const cursorReq = store.openCursor();
    const records = [];

    cursorReq.onsuccess = ce => {
      const cursor = ce.target.result;

      if (!cursor) {
        return;
      }

      if (!cursor.value.species) {
        const infotags = cursor.value.profileData.character.infotags;

        if (infotags['9']) {
          records.push(
            infotags['9'].string
              .toLowerCase()
              .replace(/[^a-z0-9 \-\_]/g, '')
              .trim()
          );
        }
      }

      cursor.continue();
    };

    txn.oncomplete = te => {
      console.log('Found', records.length, 'records to download');

      records.sort();

      const finalData = _.join(
        _.map(_.groupBy(records), (val, key) => `${key}: ${val.length}`),
        '\n'
      );

      const blob = new Blob([finalData], { type: 'plain/text;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a');
      const d = new Date();

      el.href = url;
      el.download = `unknown-species.txt`;

      document.body.appendChild(el);

      el.click();

      setTimeout(() => {
        document.body.removeChild(el);
        window.URL.revokeObjectURL(url);
      }, 0);
    };
  };
})();
