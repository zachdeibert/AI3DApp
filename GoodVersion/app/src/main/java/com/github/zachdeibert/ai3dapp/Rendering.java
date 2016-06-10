package com.github.zachdeibert.ai3dapp;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.drawable.BitmapDrawable;
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
public class Rendering extends Activity {



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
                Vars.guid = request("/login", size.x, size.y);
                while (true)
                {
                    Random rnd = new Random();
                    String csv = request("/frame/" + Vars.guid, rnd.nextDouble(), rnd.nextDouble(), rnd.nextDouble());
                    Bitmap bm = Bitmap.createBitmap(size.x, size.y, Bitmap.Config.ARGB_8888);
                    Canvas c = new Canvas(bm);
                    c.drawBitmap(bm, 0, 0, null);
                    String[] pixeldata = csv.split("\n");
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


}
