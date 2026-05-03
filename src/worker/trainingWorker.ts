import * as tf from '@tensorflow/tfjs';

self.onmessage = async (e) => {
  const { action, payload } = e.data;
  
  if (action === 'START_TRAINING') {
    const { epochs = 50, learningRate = 0.01, batchSize = 32 } = payload;
    
    // Create a simple MLP model for a toy classification task (like XOR or 2D blobs)
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [2] }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));
    
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    // Generate dummy data (2D blobs or XOR)
    const numSamples = 400;
    const xs = [];
    const ys = [];
    for (let i=0; i<numSamples; i++) {
      const x1 = Math.random() * 2 - 1;
      const x2 = Math.random() * 2 - 1;
      xs.push([x1, x2]);
      // simple non-linear boundary: circle
      const isClass1 = x1*x1 + x2*x2 < 0.5 ? 1 : 0;
      ys.push(isClass1 === 1 ? [0, 1] : [1, 0]);
    }
    
    const xTensor = tf.tensor2d(xs);
    const yTensor = tf.tensor2d(ys);

    try {
      await model.fit(xTensor, yTensor, {
        epochs,
        batchSize,
        validationSplit: 0.2,
        shuffle: true,
        yieldEvery: 'epoch',
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (!logs) return;
            self.postMessage({
              type: 'EPOCH_END',
              epoch,
              loss: logs.loss,
              acc: logs.acc,
              val_loss: logs.val_loss,
              val_acc: logs.val_acc,
            });
          }
        }
      });
      self.postMessage({ type: 'TRAINING_COMPLETE' });
    } catch (err: any) {
      self.postMessage({ type: 'TRAINING_ERROR', error: err.message });
    } finally {
      xTensor.dispose();
      yTensor.dispose();
      model.dispose();
    }
  }
};
