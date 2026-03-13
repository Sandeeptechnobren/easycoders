'use client';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className='container'>
                <div className='row'>
                    <div className='col-md-3'>
                    <img
    src="/images/logo.svg" className='ft-logo'
    alt="Easy Coders Logo"
    style={{ height: 63, margin:'0px' }}
  /> 
  <small> © {new Date().getFullYear()}{" "}
                <a 
                    href="https://easycoders.in/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    Easy Coders
                </a>. All rights reserved.</small>
                    </div>

                    <div className='col-md-3'>
<h4>Quick Links</h4>
<ul>
    <li>Home</li>
    <li>About us</li>
    <li>Contact</li>
    <li>Services</li>
</ul>
                    </div>

                    <div className='col-md-3'>
<h4>Legal Links</h4>
<ul>
    <li>Terms</li>
    <li>Privacy</li>
    <li>Cookies</li>
</ul>
                    </div>

                    <div className='col-md-3'>
<h4>Our Courses</h4>
<ul>
    <li>Data Analytics</li>
    <li>Excel Advance</li>
    <li>Design UI/UX</li>
</ul>
                    </div>
                </div>
               
            </div>
        </footer>
    );
}