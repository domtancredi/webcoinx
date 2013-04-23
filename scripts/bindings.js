define(["jquery"], function ($) {
  return function (cfg, wm, txDb, txMem, txView, exitNode, colorman) {
    txView.setDatabase(txDb);
    txView.setMemPool(txMem);

    $(txDb).bind('update', function() {
	console.log(txDb.txs);
    });

    $(cfg).bind('settingChange', function (e) {
      switch (e.key) {
      case 'exitNodeHost':
      case 'exitNodePort':
        exitNode.disconnect();
        exitNode.setSocket(cfg.get('exitNodeHost'),
                           cfg.get('exitNodePort'));
        exitNode.connect();
        break;
      case 'colordefUrls':
        colorman.reloadColors(cfg.get('colordefUrls'), function() {
		colorman.update(wm, function() {
			$(wm).trigger('walletUpdate');
		});
        });
        break;
      }
    });

    $(wm).bind('walletInit', function (e) {
      txView.setWallet(e.newWallet.wallet);
      // first load colors, then connect the wallet
      colorman.reloadColors(cfg.get('colordefUrls'), function() {
      		exitNode.connect(e.newWallet.wallet);
	});
    });

    $(wm).bind('walletDeinit', function (e) {
      txDb.clear();
      txMem.clear();
      if (e.oldWallet) {
        e.oldWallet.wallet.clearTransactions();
      }
      exitNode.disconnect();
    });

    $(exitNode).bind('blockInit blockAdd blockRevoke', function (e) {
      txView.setBlockHeight(e.height);
    });

    $(exitNode).bind('txData', function (e) {
      console.log('txdata');
      for (var i = 0; i < e.txs.length; i++) {
        if (wm.activeWallet) {
          wm.activeWallet.wallet.process(e.txs[i]);
        }
      }
      colorman.update(wm, function() {
      $(wm).trigger('walletUpdate');
      if (e.confirmed) {
        txDb.loadTransactions(e.txs);
      } else {
        txMem.loadTransactions(e.txs);
      }
	});
    });

    $(exitNode).bind('txAdd', function (e) {
      console.log('txadd');
      colorman.update(wm, function() {
        $(wm).trigger('walletUpdate');
        txDb.addTransaction(e.tx);
        txMem.removeTransaction(e.tx.hash);
      });
    });

    $(exitNode).bind('txNotify', function (e) {
      console.log('txNotify', e);
      if (wm.activeWallet) {
        wm.activeWallet.wallet.process(e.tx);
      }
      colorman.update(wm, function() {
          $(wm).trigger('walletUpdate');
          txMem.addTransaction(e.tx);
      });
    });
  };
});
