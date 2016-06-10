package com.github.zachdeibert.ai3dapp;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.drawable.BitmapDrawable;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.Image;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.os.Handler;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ImageView;

import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Random;

/**
 * An example full-screen activity that shows and hides the system UI (i.e.
 * status bar and navigation/system bar) with user interaction.
 */
public class Rendering extends Activity implements SensorEventListener {

    public double pitch;
    public double yaw;
    public double roll;

    @Override
    protected void onResume() {
        SensorManager mSensorManager;
        Sensor mSensor;
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        mSensor = mSensorManager.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR);
        super.onResume();
        mSensorManager.registerListener(this, mSensor, mSensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        setContentView(R.layout.activity_rendering);

        Thread t = new Thread(new Runnable() {

            private String request(String endpoint, Object... args) {
                StringBuilder body = new StringBuilder();
                for (Object arg : args) {
                    if (body.length() > 0) {
                        body.append(',');
                    }
                    body.append(arg);

                }
                try {
                    URL url = new URL(ServerSelect.url.concat(endpoint));
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setDoOutput(true);
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Length", String.valueOf(body.length()));
                    try (OutputStream stream = conn.getOutputStream()) {
                        stream.write(body.toString().getBytes("utf-8"));
                    }
                    try (InputStream stream = conn.getInputStream()) {
                        return IOUtils.toString(stream, "utf-8");
                    }
                } catch (IOException ex) {
                    ex.printStackTrace();
                    return "";
                }
            }

            @Override
            public void run() {
                Point size = new Point();
                getWindowManager().getDefaultDisplay().getSize(size);
                Vars.guid = request("/login", size.x / 2, size.y / 2);
                Bitmap bm = Bitmap.createBitmap(size.x / 2, size.y / 2, Bitmap.Config.ARGB_8888);
                Canvas c = new Canvas(bm);
                while (true)
                {
                    String csv = request("/frame/" + Vars.guid, roll * 200, pitch * 200, 0);
                    c.drawBitmap(bm, 0, 0, null);
                    String[] pixeldata = csv.split("\n");
                    if (pixeldata.length > 0) {
                        for (String data : pixeldata) {
                            String[] subdata = data.split(",");
                            int x = Integer.valueOf(subdata[0]);
                            int y = Integer.valueOf(subdata[1]);
                            int r = Integer.valueOf(subdata[2]);
                            int g = Integer.valueOf(subdata[3]);
                            int b = Integer.valueOf(subdata[4]);
                            Paint p = new Paint();
                            p.setColor(Color.rgb(r, g, b));
                            c.drawRect((float) x, (float) y, (float) x + 1, (float) y + 1, p);
                        }
                        final Bitmap bmf = bm;
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                ImageView p = (ImageView) findViewById(R.id.render);
                                p.setImageDrawable(new BitmapDrawable(getResources(), bmf));
                            }
                        });
                    }
                    //safeSleep(100);
                }
            }
        });
        t.start();
    }

    private void safeSleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (Exception e) {

        }
    }


    @Override
    public void onSensorChanged(SensorEvent event) {
        pitch = event.values[0];
        roll = event.values[1];
        yaw = event.values[2];

        //System.out.println("Pitch = " + pitch + ", Yaw = " + yaw + ", Roll = " + roll);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }
}
