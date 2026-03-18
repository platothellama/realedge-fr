import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Section {
  id: string;
  componentType: string;
  designVariant: string;
  name: string;
  config: any;
  content: any;
  styles: any;
  order: number;
}

interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
  sections: Section[];
  isHomepage?: boolean;
}

interface Website {
  id: string;
  name: string;
  slug: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialLinkedIn: string;
  pages: Page[];
}

@Component({
  selector: 'app-public-website',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="public-site" [style.--primary-color]="website?.primaryColor" [style.--secondary-color]="website?.secondaryColor" [style.--accent-color]="website?.accentColor" [style.--bg-color]="website?.backgroundColor" [style.--text-color]="website?.textColor" [style.font-family]="website?.fontFamily">
      <!-- Header -->
      @if (headerSection) {
        <header class="site-header" [class.transparent]="headerSection.config?.overlay" [class.sticky]="headerSection.config?.sticky">
          <div class="container header-content">
            @if (headerSection.content?.logo) {
              <a [routerLink]="['/website', website?.slug]" class="logo">
                <img [src]="headerSection.content.logo" alt="{{ website?.name }}">
              </a>
            } @else {
              <a [routerLink]="['/website', website?.slug]" class="logo-text">{{ website?.name }}</a>
            }
            <nav class="main-nav">
              @for (link of headerSection.content?.navLinks || []; track link.url) {
                <a [routerLink]="['/website', website?.slug, link.url]">{{ link.label }}</a>
              }
            </nav>
            @if (headerSection.config?.showContactButton) {
              <a [routerLink]="['/website', website?.slug, '/contact']" class="cta-button">Contact Us</a>
            }
          </div>
        </header>
      }

      <!-- Main Content -->
      <main>
        @for (section of currentPage?.sections || []; track section.id) {
          @switch (section.componentType) {
            @case ('hero') {
              <section class="hero-section" [class]="'hero-' + section.designVariant" [style.background-image]="section.content?.backgroundImage ? 'url(' + section.content.backgroundImage + ')' : ''">
                @if (section.config?.overlay) {
                  <div class="overlay" [style.opacity]="section.config?.overlayOpacity || 0.4"></div>
                }
                <div class="container hero-content">
                  @if (section.designVariant === 'centered') {
                    <div class="hero-centered">
                      <h1>{{ section.content?.title || 'Welcome' }}</h1>
                      <p>{{ section.content?.subtitle || '' }}</p>
                      <div class="hero-buttons">
                        @if (section.content?.primaryButtonText) {
                          <a [routerLink]="[section.content?.primaryButtonUrl]" class="btn btn-primary">{{ section.content?.primaryButtonText }}</a>
                        }
                        @if (section.content?.secondaryButtonText) {
                          <a [routerLink]="[section.content?.secondaryButtonUrl]" class="btn btn-secondary">{{ section.content?.secondaryButtonText }}</a>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="hero-split">
                      <div class="hero-text">
                        <h1>{{ section.content?.title || 'Welcome' }}</h1>
                        <p>{{ section.content?.subtitle || '' }}</p>
                        <div class="hero-buttons">
                          @if (section.content?.primaryButtonText) {
                            <a [routerLink]="[section.content?.primaryButtonUrl]" class="btn btn-primary">{{ section.content?.primaryButtonText }}</a>
                          }
                          @if (section.content?.secondaryButtonText) {
                            <a [routerLink]="[section.content?.secondaryButtonUrl]" class="btn btn-secondary">{{ section.content?.secondaryButtonText }}</a>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </section>
            }
            @case ('propertySearch') {
              <section class="search-section">
                <div class="container">
                  <div class="search-box">
                    <input type="text" [placeholder]="section.content?.placeholder || 'Search properties...'" class="search-input">
                    <button class="search-button">{{ section.content?.searchButtonText || 'Search' }}</button>
                  </div>
                </div>
              </section>
            }
            @case ('featureCards') {
              <section class="features-section">
                <div class="container">
                  <div class="features-grid" [class]="'cols-' + (section.config?.columns || 3)">
                    @for (feature of section.content?.features || []; track feature.title) {
                      <div class="feature-card">
                        @if (section.config?.showIcons) {
                          <div class="feature-icon">
                            <span class="material-icon">{{ feature.icon || 'star' }}</span>
                          </div>
                        }
                        <h3>{{ feature.title }}</h3>
                        <p>{{ feature.description }}</p>
                      </div>
                    }
                  </div>
                </div>
              </section>
            }
            @case ('about') {
              <section class="about-section">
                <div class="container">
                  @if (section.designVariant === 'split') {
                    <div class="about-split">
                      <div class="about-image">
                        @if (section.content?.image) {
                          <img [src]="section.content.image" [alt]="section.content?.title">
                        }
                      </div>
                      <div class="about-content">
                        <h2>{{ section.content?.title || 'About Us' }}</h2>
                        <p>{{ section.content?.content }}</p>
                        @if (section.config?.showStats) {
                          <div class="stats-row">
                            @for (stat of section.content?.stats || []; track stat.label) {
                              <div class="stat">
                                <span class="stat-value">{{ stat.value }}</span>
                                <span class="stat-label">{{ stat.label }}</span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="about-default">
                      <h2>{{ section.content?.title || 'About Us' }}</h2>
                      <p>{{ section.content?.content }}</p>
                    </div>
                  }
                </div>
              </section>
            }
            @case ('propertyGrid') {
              <section class="properties-section">
                <div class="container">
                  <div class="section-header">
                    <h2>{{ section.content?.title || 'Featured Properties' }}</h2>
                    <p>{{ section.content?.subtitle || '' }}</p>
                  </div>
                  <div class="properties-grid" [class]="'cols-' + (section.config?.columns || 3)">
                    @for (property of properties; track property.id) {
                      <div class="property-card">
                        <div class="property-image">
                          @if (property.images?.[0]) {
                            <img [src]="property.images[0]" [alt]="property.title">
                          } @else {
                            <div class="no-image">No Image</div>
                          }
                          <span class="property-status">{{ property.status }}</span>
                        </div>
                        <div class="property-info">
                          <h3>{{ property.title }}</h3>
                          <p class="property-address">{{ property.address }}</p>
                          <div class="property-details">
                            @if (property.bedrooms) { <span>{{ property.bedrooms }} BD</span> }
                            @if (property.bathrooms) { <span>{{ property.bathrooms }} BA</span> }
                            @if (property.squareFeet) { <span>{{ property.squareFeet }} sqft</span> }
                          </div>
                          <p class="property-price">\${{ property.price | number }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </section>
            }
            @case ('cta') {
              <section class="cta-section" [class]="'cta-' + section.designVariant">
                <div class="container">
                  <h2>{{ section.content?.title || 'Ready to Get Started?' }}</h2>
                  <p>{{ section.content?.description || '' }}</p>
                  <div class="cta-buttons">
                    @if (section.content?.primaryButtonText) {
                      <a [routerLink]="[section.content?.primaryButtonUrl]" class="btn btn-primary">{{ section.content?.primaryButtonText }}</a>
                    }
                    @if (section.config?.showSecondaryButton && section.content?.secondaryButtonText) {
                      <a [routerLink]="[section.content?.secondaryButtonUrl]" class="btn btn-secondary">{{ section.content?.secondaryButtonText }}</a>
                    }
                  </div>
                </div>
              </section>
            }
            @case ('testimonials') {
              <section class="testimonials-section">
                <div class="container">
                  <div class="testimonials-grid">
                    @for (testimonial of section.content?.testimonials || []; track testimonial.name) {
                      <div class="testimonial-card">
                        @if (section.config?.showRating) {
                          <div class="rating">
                            @for (star of [1,2,3,4,5]; track star) {
                              <span class="star" [class.filled]="star <= testimonial.rating">★</span>
                            }
                          </div>
                        }
                        <p class="quote">"{{ testimonial.text }}"</p>
                        <div class="author">
                          @if (section.config?.showAvatar) {
                            <div class="avatar">{{ testimonial.name?.charAt(0) }}</div>
                          }
                          <span>{{ testimonial.name }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </section>
            }
            @case ('contactForm') {
              <section class="contact-section">
                <div class="container">
                  <div class="contact-wrapper">
                    <div class="contact-info">
                      <h2>{{ section.content?.title || 'Contact Us' }}</h2>
                      <p>{{ section.content?.subtitle || '' }}</p>
                      @if (website?.contactPhone) {
                        <div class="contact-item">
                          <span class="material-icon">phone</span>
                          <span>{{ website?.contactPhone }}</span>
                        </div>
                      }
                      @if (website?.contactEmail) {
                        <div class="contact-item">
                          <span class="material-icon">email</span>
                          <span>{{ website?.contactEmail }}</span>
                        </div>
                      }
                      @if (website?.contactAddress) {
                        <div class="contact-item">
                          <span class="material-icon">location_on</span>
                          <span>{{ website?.contactAddress }}</span>
                        </div>
                      }
                    </div>
                    <form class="contact-form" (submit)="$event.preventDefault()">
                      <h3>{{ section.content?.title || 'Send a Message' }}</h3>
                      @if (section.config?.showName) {
                        <input type="text" placeholder="Your Name" class="form-input">
                      }
                      @if (section.config?.showEmail) {
                        <input type="email" placeholder="Your Email" class="form-input">
                      }
                      @if (section.config?.showPhone) {
                        <input type="tel" placeholder="Your Phone" class="form-input">
                      }
                      @if (section.config?.showSubject) {
                        <input type="text" placeholder="Subject" class="form-input">
                      }
                      @if (section.config?.showMessage) {
                        <textarea [placeholder]="section.content?.subtitle || 'Your Message'" rows="5" class="form-input"></textarea>
                      }
                      <button type="submit" class="btn btn-primary">{{ section.content?.submitButtonText || 'Send Message' }}</button>
                    </form>
                  </div>
                </div>
              </section>
            }
            @case ('newsletter') {
              <section class="newsletter-section">
                <div class="container">
                  <div class="newsletter-box">
                    <h2>{{ section.content?.title || 'Subscribe to Our Newsletter' }}</h2>
                    <p>{{ section.content?.subtitle || 'Get the latest updates' }}</p>
                    <form class="newsletter-form" (submit)="$event.preventDefault()">
                      <input type="email" [placeholder]="section.content?.placeholder || 'Enter your email'" class="newsletter-input">
                      <button type="submit" class="btn btn-primary">{{ section.content?.buttonText || 'Subscribe' }}</button>
                    </form>
                  </div>
                </div>
              </section>
            }
            @case ('agentTeam') {
              <section class="team-section">
                <div class="container">
                  <div class="section-header">
                    <h2>{{ section.content?.title || 'Our Team' }}</h2>
                    <p>{{ section.content?.subtitle || '' }}</p>
                  </div>
                  <div class="team-grid" [class]="'cols-' + (section.config?.columns || 4)">
                    @for (agent of agents; track agent.id) {
                      <div class="team-card">
                        <div class="agent-photo">
                          @if (agent.photo) {
                            <img [src]="agent.photo" [alt]="agent.name">
                          } @else {
                            <div class="no-photo">{{ agent.name?.charAt(0) }}</div>
                          }
                        </div>
                        <h3>{{ agent.name }}</h3>
                        @if (section.config?.showContact) {
                          <p class="agent-email">{{ agent.email }}</p>
                          @if (agent.phone) {
                            <p class="agent-phone">{{ agent.phone }}</p>
                          }
                        }
                        @if (section.config?.showSocial) {
                          <div class="social-links">
                            @if (agent.social?.facebook) { <a href="#">FB</a> }
                            @if (agent.social?.linkedin) { <a href="#">LI</a> }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </section>
            }
            @case ('footer') {
              <footer class="site-footer">
                <div class="container">
                  <div class="footer-grid" [class]="'cols-' + (section.config?.columns || 4)">
                    <div class="footer-brand">
                      @if (section.content?.companyName) {
                        <h3>{{ section.content.companyName }}</h3>
                      }
                      <p>{{ section.content?.description || website?.description }}</p>
                    </div>
                    @if (section.content?.quickLinks?.length) {
                      <div class="footer-links">
                        <h4>Quick Links</h4>
                        @for (link of section.content.quickLinks; track link.label) {
                          <a [routerLink]="[link.url]">{{ link.label }}</a>
                        }
                      </div>
                    }
                    @if (section.content?.services?.length) {
                      <div class="footer-links">
                        <h4>Services</h4>
                        @for (link of section.content.services; track link.label) {
                          <a [routerLink]="[link.url]">{{ link.label }}</a>
                        }
                      </div>
                    }
                    @if (section.config?.showSocial) {
                      <div class="footer-social">
                        <h4>Follow Us</h4>
                        <div class="social-icons">
                          @if (website?.socialFacebook) { <a href="{{ website?.socialFacebook }}" target="_blank">Facebook</a> }
                          @if (website?.socialInstagram) { <a href="{{ website?.socialInstagram }}" target="_blank">Instagram</a> }
                          @if (website?.socialTwitter) { <a href="{{ website?.socialTwitter }}" target="_blank">Twitter</a> }
                          @if (website?.socialLinkedIn) { <a href="{{ website?.socialLinkedIn }}" target="_blank">LinkedIn</a> }
                        </div>
                      </div>
                    }
                  </div>
                  @if (section.config?.showCopyright) {
                    <div class="footer-bottom">
                      <p>&copy; {{ currentYear }} {{ website?.name }}. All rights reserved.</p>
                    </div>
                  }
                </div>
              </footer>
            }
          }
        }
      </main>
    </div>
  `,
  styles: [`
    .public-site {
      --primary-color: #6366f1;
      --secondary-color: #10b981;
      --accent-color: #f59e0b;
      --bg-color: #ffffff;
      --text-color: #1f2937;
      background: var(--bg-color);
      color: var(--text-color);
      min-height: 100vh;
    }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    
    /* Header */
    .site-header {
      background: var(--bg-color);
      padding: 16px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: relative;
      z-index: 100;
    }
    .site-header.sticky { position: sticky; top: 0; }
    .site-header.transparent { background: transparent; box-shadow: none; }
    .header-content { display: flex; align-items: center; justify-content: space-between; }
    .logo img { height: 40px; }
    .logo-text { font-size: 24px; font-weight: 700; color: var(--primary-color); text-decoration: none; }
    .main-nav { display: flex; gap: 24px; }
    .main-nav a { color: var(--text-color); text-decoration: none; font-weight: 500; }
    .main-nav a:hover { color: var(--primary-color); }
    .cta-button { background: var(--primary-color); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    
    /* Hero */
    .hero-section { position: relative; padding: 100px 0; background-size: cover; background-position: center; }
    .hero-section .overlay { position: absolute; inset: 0; background: #000; }
    .hero-content { position: relative; z-index: 1; }
    .hero-section h1 { font-size: 48px; color: white; margin-bottom: 16px; }
    .hero-section p { font-size: 20px; color: rgba(255,255,255,0.9); margin-bottom: 24px; }
    .hero-centered { text-align: center; }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; }
    .btn { padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-secondary { background: white; color: var(--text-color); }
    
    /* Features */
    .features-section { padding: 80px 0; }
    .features-grid { display: grid; gap: 32px; }
    .features-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    .feature-card { text-align: center; padding: 32px; background: #f9fafb; border-radius: 12px; }
    .feature-icon { width: 64px; height: 64px; margin: 0 auto 16px; background: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .feature-icon .material-icon { color: white; font-size: 28px; }
    .feature-card h3 { margin: 0 0 8px; font-size: 20px; }
    .feature-card p { margin: 0; color: #6b7280; }
    
    /* About */
    .about-section { padding: 80px 0; }
    .about-split { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    .about-image img { width: 100%; border-radius: 12px; }
    .about-content h2 { font-size: 36px; margin: 0 0 16px; }
    .about-content p { font-size: 16px; color: #6b7280; line-height: 1.7; }
    .stats-row { display: flex; gap: 32px; margin-top: 24px; }
    .stat { text-align: center; }
    .stat-value { display: block; font-size: 32px; font-weight: 700; color: var(--primary-color); }
    .stat-label { font-size: 14px; color: #6b7280; }
    
    /* Properties */
    .properties-section { padding: 80px 0; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header h2 { font-size: 36px; margin: 0 0 8px; }
    .section-header p { color: #6b7280; margin: 0; }
    .properties-grid { display: grid; gap: 24px; }
    .properties-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    .property-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .property-image { position: relative; height: 200px; background: #e5e7eb; }
    .property-image img { width: 100%; height: 100%; object-fit: cover; }
    .property-status { position: absolute; top: 12px; left: 12px; background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .property-info { padding: 16px; }
    .property-info h3 { margin: 0 0 4px; font-size: 18px; }
    .property-address { margin: 0 0 8px; color: #6b7280; font-size: 14px; }
    .property-details { display: flex; gap: 16px; color: #6b7280; font-size: 14px; margin-bottom: 12px; }
    .property-price { margin: 0; font-size: 20px; font-weight: 700; color: var(--primary-color); }
    
    /* CTA */
    .cta-section { padding: 80px 0; background: var(--primary-color); text-align: center; }
    .cta-section h2 { font-size: 36px; color: white; margin: 0 0 16px; }
    .cta-section p { color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 24px; }
    .cta-buttons { display: flex; gap: 16px; justify-content: center; }
    .cta-buttons .btn-secondary { background: white; color: var(--primary-color); }
    
    /* Testimonials */
    .testimonials-section { padding: 80px 0; background: #f9fafb; }
    .testimonials-grid { display: grid; gap: 24px; }
    .testimonial-card { background: white; padding: 24px; border-radius: 12px; }
    .rating { margin-bottom: 12px; }
    .star { color: #d1d5db; font-size: 18px; }
    .star.filled { color: #f59e0b; }
    .quote { font-style: italic; color: #6b7280; margin: 0 0 16px; }
    .author { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .author span { font-weight: 500; }
    
    /* Contact */
    .contact-section { padding: 80px 0; }
    .contact-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
    .contact-info h2 { font-size: 36px; margin: 0 0 16px; }
    .contact-item { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; color: #6b7280; }
    .contact-item .material-icon { color: var(--primary-color); }
    .contact-form { background: #f9fafb; padding: 32px; border-radius: 12px; }
    .contact-form h3 { margin: 0 0 24px; }
    .form-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 16px; font-size: 16px; }
    .contact-form .btn { width: 100%; }
    
    /* Newsletter */
    .newsletter-section { padding: 80px 0; background: var(--primary-color); }
    .newsletter-box { text-align: center; }
    .newsletter-box h2 { color: white; font-size: 32px; margin: 0 0 8px; }
    .newsletter-box p { color: rgba(255,255,255,0.9); margin: 0 0 24px; }
    .newsletter-form { display: flex; gap: 12px; max-width: 500px; margin: 0 auto; }
    .newsletter-input { flex: 1; padding: 14px; border: none; border-radius: 8px; font-size: 16px; }
    
    /* Team */
    .team-section { padding: 80px 0; }
    .team-grid { display: grid; gap: 24px; }
    .team-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
    .team-card { text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px; }
    .agent-photo { width: 100px; height: 100px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; }
    .agent-photo img { width: 100%; height: 100%; object-fit: cover; }
    .no-photo { width: 100%; height: 100%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 600; }
    .team-card h3 { margin: 0 0 4px; }
    .agent-email, .agent-phone { margin: 0; color: #6b7280; font-size: 14px; }
    
    /* Footer */
    .site-footer { padding: 60px 0 24px; background: #1f2937; color: white; }
    .footer-grid { display: grid; gap: 32px; }
    .footer-grid.cols-4 { grid-template-columns: 2fr 1fr 1fr 1fr; }
    .footer-brand h3 { font-size: 24px; margin: 0 0 8px; }
    .footer-brand p { color: #9ca3af; margin: 0; }
    .footer-links h4 { margin: 0 0 16px; font-size: 16px; }
    .footer-links a { display: block; color: #9ca3af; text-decoration: none; margin-bottom: 8px; }
    .footer-links a:hover { color: white; }
    .social-icons { display: flex; gap: 12px; }
    .social-icons a { color: #9ca3af; text-decoration: none; }
    .footer-bottom { margin-top: 40px; padding-top: 24px; border-top: 1px solid #374151; text-align: center; color: #9ca3af; }
    
    @media (max-width: 768px) {
      .features-grid.cols-3, .properties-grid.cols-3, .team-grid.cols-4, .footer-grid.cols-4 { grid-template-columns: 1fr; }
      .about-split, .contact-wrapper { grid-template-columns: 1fr; }
      .hero-section h1 { font-size: 32px; }
      .main-nav { display: none; }
    }
  `]
})
export class PublicWebsiteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  
  website: Website | null = null;
  currentPage: Page | null = null;
  headerSection: Section | null = null;
  properties: any[] = [];
  agents: any[] = [];
  currentYear = new Date().getFullYear();
  
  private apiUrl = 'https://realedge-frontend-production.up.railway.app/api';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadWebsite(slug);
      }
    });
    
    this.route.url.subscribe(url => {
      const path = url.map(u => u.path).join('/');
      if (this.website && path) {
        const site = this.website;
        this.currentPage = site.pages.find(p => p.slug === path) || site.pages[0];
      } else if (this.website) {
        const site = this.website;
        this.currentPage = site.pages.find(p => p.isHomepage) || site.pages[0];
      }
    });
  }

  loadWebsite(slug: string) {
    this.http.get<any>(`${this.apiUrl}/websites/public/${slug}`).subscribe({
      next: (res) => {
        this.website = res;
        this.headerSection = res.pages?.[0]?.sections?.find((s: Section) => s.componentType === 'header');
        this.currentPage = res.pages?.find((p: Page) => p.isHomepage) || res.pages?.[0];
        this.loadDataSources();
      },
      error: () => {
        console.error('Website not found');
      }
    });
  }

  loadDataSources() {
    this.http.get<any>(`${this.apiUrl}/websites/data-sources`).subscribe({
      next: (res) => {
        this.properties = res.properties || [];
        this.agents = res.agents || [];
      }
    });
  }
}
