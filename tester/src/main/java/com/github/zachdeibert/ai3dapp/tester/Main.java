package com.github.zachdeibert.ai3dapp.tester;

import java.awt.Color;
import java.awt.EventQueue;
import java.awt.Graphics;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.swing.JFrame;
import javax.swing.JOptionPane;

import org.apache.commons.io.IOUtils;

public class Main extends JFrame implements KeyListener {
	private static final long serialVersionUID = 7909761797962066174L;
	private final String url;
	private final String guid;
	private boolean forward;
	private boolean left;
	private boolean backward;
	private boolean right;
	private boolean up;
	private boolean down;
	private boolean firstFrame;

	private String request(String endpoint, Object... args) {
		StringBuilder body = new StringBuilder();
		for ( Object arg : args ) {
			if ( body.length() > 0 ) {
				body.append(',');
			}
			body.append(arg);
		}
		try {
			URL url = new URL(this.url.concat(endpoint));
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setDoOutput(true);
			conn.setRequestMethod("POST");
			conn.setRequestProperty("Content-Length", String.valueOf(body.length()));
			try ( OutputStream stream = conn.getOutputStream() ) {
				stream.write(body.toString().getBytes("utf-8"));
			}
			try ( InputStream stream = conn.getInputStream() ) {
				return IOUtils.toString(stream, "utf-8");
			}
		} catch ( IOException ex ) {
			ex.printStackTrace();
			return "";
		}
	}

	private void drawPixel(Graphics gfx, int x, int y, int r, int g, int b) {
		gfx.setColor(new Color(r, g, b));
		gfx.fillRect(x - 1, y - 1, 1, 1);
	}

	@Override
	public void paint(Graphics g) {
		if ( firstFrame ) {
			g.setColor(Color.BLACK);
			g.fillRect(0, 0, getWidth(), getHeight());
			firstFrame = false;
		}
		int dx = (right ? 100 : 0) - (left ? 100 : 0);
		int dy = (backward ? 100 : 0) - (forward ? 100 : 0);
		int dz = (up ? 100 : 0) - (down ? 100 : 0);
		String resp = request("/frame/".concat(guid), dx, dy, dz);
		String[] pixels = resp.split("\n");
		for ( String pixel : pixels ) {
			String[] parts = pixel.split(",");
			drawPixel(g, Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), Integer.parseInt(parts[2]),
					Integer.parseInt(parts[3]), Integer.parseInt(parts[4]));
		}
		repaint();
	}
	
	@Override
	public void paintAll(Graphics g) {
		paint(g);
	}

	public void key(KeyEvent e, boolean value) {
		switch ( e.getKeyChar() ) {
		case 'w':
			forward = value;
			break;
		case 'a':
			left = value;
			break;
		case 's':
			backward = value;
			break;
		case 'd':
			right = value;
			break;
		case 'q':
			up = value;
			break;
		case 'e':
			down = value;
			break;
		}
	}

	@Override
	public void keyPressed(KeyEvent e) {
		key(e, true);
	}

	@Override
	public void keyReleased(KeyEvent e) {
		key(e, false);
	}

	@Override
	public void keyTyped(KeyEvent e) {
	}

	public static void main(String[] args) {
		EventQueue.invokeLater(() -> {
			new Main().setVisible(true);
		});
	}

	public Main() {
		setDefaultCloseOperation(EXIT_ON_CLOSE);
		setSize(640, 480);
		url = JOptionPane.showInputDialog(this, "Please enter server IP", "http://localhost:8080");
		guid = request("/login", getWidth(), getHeight());
		firstFrame = true;
		addKeyListener(this);
		repaint();
	}
}
