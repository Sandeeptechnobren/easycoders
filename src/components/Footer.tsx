'use client';
import styles from './Footer.module.css';
import Image from "next/image";

export default function Footer() {
    return (
        <>
        <footer className={styles.footer}>
            <div className='container'>
                <div className='row'>
                    <div className='col-md-3'>
                        <Image
                            src="/images/logo.svg"
                            className={styles.ftLogo}
                            alt="Easy Coders Logo"
                            width={180}
                            height={63}
                        />
                        <small>
                            © {new Date().getFullYear()}{" "}
                            <a
                                href="https://easycoders.in/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Easy Coders
                            </a>. All rights reserved.
                        </small>
                    </div>

                    <div className='col-md-2'>
                        <h4>Quick Links</h4>
                        <ul>
                            <li>Home</li>
                            <li>About us</li>
                            <li>Contact</li>
                            <li>Services</li>
                        </ul>
                    </div>

                    <div className='col-md-2'>
                        <h4>Legal Links</h4>
                        <ul>
                            <li>Terms</li>
                            <li>Privacy</li>
                            <li>Cookies</li>
                        </ul>
                    </div>

                    <div className='col-md-2'>
                        <h4>Our Courses</h4>
                        <ul>
                            <li>Data Analytics</li>
                            <li>Excel Advance</li>
                            <li>Design UI/UX</li>
                        </ul>
                    </div>

                    {/* Address column — right after Our Courses */}
                    <div className='col-md-3'>
                        <h4>Contact Us</h4>
                        <address className={styles.ftAddress}>
                            <strong>Technobren Infotech Pvt. Ltd</strong>
                            City Tower, Varanasi–Lucknow Rd,<br />
                            Wazidpur, Jaunpur, UP – 222002
                            <br /><br />
                            <a href="tel:+917523930301">📞 7523930301</a>
                            <br />
                            <a href="mailto:team@easycoders.in">✉️ team@easycoders.in</a>
                        </address>
                    </div>
                </div>
            </div>
        </footer>
        </>
    );
}