/**
 * Dependency Scanner Service
 * Automated dependency vulnerability scanning and management
 */

import { vulnerabilityManagementService, Vulnerability, DependencyInfo } from './vulnerabilityManagementService';

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
  repository?: string;
  license: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface AuditResult {
  advisories: Record<string, Advisory>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
    };
    dependencies: number;
    devDependencies: number;
    optionalDependencies: number;
    totalDependencies: number;
  };
}

export interface Advisory {
  id: number;
  title: string;
  module_name: string;
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  cves: string[];
  vulnerable_versions: string;
  patched_versions: string;
  overview: string;
  recommendation: string;
  references: string[];
  created: string;
  updated: string;
  findings: Array<{
    version: string;
    paths: string[];
  }>;
}

export interface LicenseInfo {
  name: string;
  version: string;
  license: string;
  licenseFile?: string;
  repository?: string;
  isCompatible: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  issues: string[];
}

export class DependencyScannerService {
  private static instance: DependencyScannerService;
  private packageCache: Map<string, PackageInfo> = new Map();
  private licenseCache: Map<string, LicenseInfo> = new Map();

  private constructor() {
    this.initializeScanner();
  }

  static getInstance(): DependencyScannerService {
    if (!DependencyScannerService.instance) {
      DependencyScannerService.instance = new DependencyScannerService();
    }
    return DependencyScannerService.instance;
  }

  /**
   * Initialize dependency scanner
   */
  private initializeScanner(): void {
    console.log('Dependency Scanner Service initialized');
  }

  /**
   * Scan package.json for dependencies
   */
  async scanPackageJson(packageJsonPath: string = 'package.json'): Promise<{
    dependencies: DependencyInfo[];
    devDependencies: DependencyInfo[];
    totalPackages: number;
  }> {
    try {
      // In a real implementation, this would read the actual package.json file
      // For now, we'll simulate with common React Native dependencies
      const mockPackageJson = {
        dependencies: {
          'react': '^18.2.0',
          'react-native': '^0.72.0',
          '@supabase/supabase-js': '^2.38.0',
          '@react-navigation/native': '^6.1.0',
          '@react-navigation/stack': '^6.3.0',
          'react-native-purchases': '^7.0.0',
          'lodash': '^4.17.20',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-native': '^0.72.0',
          'jest': '^29.0.0',
          '@testing-library/react-native': '^12.0.0',
          'typescript': '^5.0.0',
        }
      };

      const dependencies = await this.processDependencies(mockPackageJson.dependencies, 'direct');
      const devDependencies = await this.processDependencies(mockPackageJson.devDependencies, 'direct');

      return {
        dependencies,
        devDependencies,
        totalPackages: dependencies.length + devDependencies.length,
      };
    } catch (error) {
      console.error('Failed to scan package.json:', error);
      throw new Error('Package.json scan failed');
    }
  }

  /**
   * Process dependencies and gather information
   */
  private async processDependencies(
    deps: Record<string, string>,
    type: 'direct' | 'transitive'
  ): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];

    for (const [name, versionRange] of Object.entries(deps)) {
      try {
        const depInfo = await this.getDependencyInfo(name, versionRange, type);
        dependencies.push(depInfo);
      } catch (error) {
        console.error(`Failed to get info for ${name}:`, error);
        // Create minimal dependency info
        dependencies.push({
          name,
          version: versionRange.replace(/[\^~]/, ''),
          type,
          license: 'Unknown',
          lastUpdated: new Date(),
          isOutdated: false,
          vulnerabilities: [],
        });
      }
    }

    return dependencies;
  }

  /**
   * Get detailed dependency information
   */
  private async getDependencyInfo(
    name: string,
    versionRange: string,
    type: 'direct' | 'transitive'
  ): Promise<DependencyInfo> {
    // Check cache first
    const cacheKey = `${name}@${versionRange}`;
    if (this.packageCache.has(cacheKey)) {
      const cached = this.packageCache.get(cacheKey)!;
      return this.convertToDepInfo(cached, type);
    }

    // In a real implementation, this would query npm registry
    // For now, we'll simulate with mock data
    const mockPackageInfo = await this.getMockPackageInfo(name, versionRange);
    this.packageCache.set(cacheKey, mockPackageInfo);

    return this.convertToDepInfo(mockPackageInfo, type);
  }

  /**
   * Get mock package information
   */
  private async getMockPackageInfo(name: string, versionRange: string): Promise<PackageInfo> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const version = versionRange.replace(/[\^~]/, '');
    
    // Mock package data based on common packages
    const mockData: Record<string, Partial<PackageInfo>> = {
      'react': {
        description: 'React is a JavaScript library for building user interfaces.',
        homepage: 'https://reactjs.org/',
        license: 'MIT',
      },
      'react-native': {
        description: 'A framework for building native apps using React',
        homepage: 'https://reactnative.dev/',
        license: 'MIT',
      },
      'lodash': {
        description: 'Lodash modular utilities.',
        homepage: 'https://lodash.com/',
        license: 'MIT',
      },
      '@supabase/supabase-js': {
        description: 'Supabase client for JavaScript',
        homepage: 'https://supabase.com/',
        license: 'MIT',
      },
    };

    const baseInfo = mockData[name] || {};

    return {
      name,
      version,
      description: baseInfo.description || `${name} package`,
      homepage: baseInfo.homepage,
      repository: `https://github.com/example/${name}`,
      license: baseInfo.license || 'MIT',
      ...baseInfo,
    };
  }

  /**
   * Convert PackageInfo to DependencyInfo
   */
  private convertToDepInfo(packageInfo: PackageInfo, type: 'direct' | 'transitive'): DependencyInfo {
    // Check if package is outdated (mock logic)
    const isOutdated = Math.random() > 0.7; // 30% chance of being outdated
    const monthsBehind = isOutdated ? Math.floor(Math.random() * 12) + 1 : 0;

    return {
      name: packageInfo.name,
      version: packageInfo.version,
      type,
      license: packageInfo.license,
      lastUpdated: new Date(Date.now() - monthsBehind * 30 * 24 * 60 * 60 * 1000),
      isOutdated,
      latestVersion: isOutdated ? this.generateNewerVersion(packageInfo.version) : undefined,
      monthsBehind: monthsBehind || undefined,
      vulnerabilities: [], // Will be populated by vulnerability scan
    };
  }

  /**
   * Generate a newer version for outdated packages
   */
  private generateNewerVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    // Increment minor version
    parts[1] = (parts[1] || 0) + Math.floor(Math.random() * 3) + 1;
    parts[2] = Math.floor(Math.random() * 10);
    return parts.join('.');
  }

  /**
   * Run npm audit simulation
   */
  async runNpmAudit(): Promise<AuditResult> {
    try {
      console.log('Running npm audit...');

      // Simulate npm audit command
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock audit result
      const auditResult: AuditResult = {
        advisories: {
          '1179': {
            id: 1179,
            title: 'Prototype Pollution in lodash',
            module_name: 'lodash',
            severity: 'high',
            cves: ['CVE-2021-23337'],
            vulnerable_versions: '<4.17.21',
            patched_versions: '>=4.17.21',
            overview: 'lodash versions prior to 4.17.21 are vulnerable to Command Injection via template.',
            recommendation: 'Upgrade to version 4.17.21 or later',
            references: [
              'https://github.com/lodash/lodash/commit/3469357cff396a26c363f8c1b5a91dde28ba4b1c',
              'https://nvd.nist.gov/vuln/detail/CVE-2021-23337'
            ],
            created: '2021-02-15T00:00:00.000Z',
            updated: '2021-02-15T00:00:00.000Z',
            findings: [
              {
                version: '4.17.20',
                paths: ['lodash']
              }
            ]
          }
        },
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 0,
            high: 1,
            critical: 0
          },
          dependencies: 7,
          devDependencies: 5,
          optionalDependencies: 0,
          totalDependencies: 12
        }
      };

      console.log('npm audit completed');
      return auditResult;
    } catch (error) {
      console.error('npm audit failed:', error);
      throw new Error('npm audit execution failed');
    }
  }

  /**
   * Convert audit result to vulnerabilities
   */
  convertAuditToVulnerabilities(auditResult: AuditResult): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    for (const [id, advisory] of Object.entries(auditResult.advisories)) {
      const severity = this.mapAuditSeverity(advisory.severity);
      const cvssScore = this.estimateCVSSScore(advisory.severity);

      const vulnerability: Vulnerability = {
        id: `npm-${advisory.id}`,
        title: advisory.title,
        description: advisory.overview,
        severity,
        cvssScore,
        cveId: advisory.cves[0],
        affectedPackage: advisory.module_name,
        affectedVersions: [advisory.vulnerable_versions],
        fixedVersion: advisory.patched_versions,
        publishedDate: new Date(advisory.created),
        discoveredDate: new Date(),
        status: 'open',
        source: 'npm_audit',
      };

      vulnerabilities.push(vulnerability);
    }

    return vulnerabilities;
  }

  /**
   * Map npm audit severity to our severity levels
   */
  private mapAuditSeverity(auditSeverity: Advisory['severity']): Vulnerability['severity'] {
    const mapping: Record<Advisory['severity'], Vulnerability['severity']> = {
      'info': 'low',
      'low': 'low',
      'moderate': 'medium',
      'high': 'high',
      'critical': 'critical',
    };
    return mapping[auditSeverity];
  }

  /**
   * Estimate CVSS score based on severity
   */
  private estimateCVSSScore(severity: Advisory['severity']): number {
    const scores: Record<Advisory['severity'], number> = {
      'info': 2.0,
      'low': 3.5,
      'moderate': 5.5,
      'high': 7.5,
      'critical': 9.0,
    };
    return scores[severity];
  }

  /**
   * Scan licenses for compliance
   */
  async scanLicenses(): Promise<LicenseInfo[]> {
    try {
      console.log('Scanning licenses...');

      const dependencies = vulnerabilityManagementService.listDependencies();
      const licenseInfos: LicenseInfo[] = [];

      for (const dep of dependencies) {
        const licenseInfo = await this.analyzeLicense(dep);
        licenseInfos.push(licenseInfo);
        this.licenseCache.set(dep.name, licenseInfo);
      }

      console.log(`License scan completed: ${licenseInfos.length} packages analyzed`);
      return licenseInfos;
    } catch (error) {
      console.error('License scan failed:', error);
      throw new Error('License scanning failed');
    }
  }

  /**
   * Analyze license compatibility
   */
  private async analyzeLicense(dependency: DependencyInfo): Promise<LicenseInfo> {
    const license = dependency.license;
    const issues: string[] = [];
    let isCompatible = true;
    let riskLevel: LicenseInfo['riskLevel'] = 'low';

    // Define license compatibility rules
    const compatibleLicenses = [
      'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense'
    ];
    
    const problematicLicenses = [
      'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0'
    ];

    if (!license || license === 'Unknown') {
      issues.push('License information is missing or unclear');
      isCompatible = false;
      riskLevel = 'high';
    } else if (problematicLicenses.includes(license)) {
      issues.push(`${license} may have copyleft requirements`);
      isCompatible = false;
      riskLevel = 'high';
    } else if (!compatibleLicenses.includes(license)) {
      issues.push(`${license} compatibility needs manual review`);
      riskLevel = 'medium';
    }

    return {
      name: dependency.name,
      version: dependency.version,
      license,
      isCompatible,
      riskLevel,
      issues,
    };
  }

  /**
   * Check for outdated dependencies
   */
  async checkOutdatedDependencies(): Promise<{
    outdated: DependencyInfo[];
    upToDate: DependencyInfo[];
    summary: {
      total: number;
      outdated: number;
      criticallyOutdated: number; // >12 months
    };
  }> {
    try {
      console.log('Checking for outdated dependencies...');

      const dependencies = vulnerabilityManagementService.listDependencies();
      const outdated: DependencyInfo[] = [];
      const upToDate: DependencyInfo[] = [];

      for (const dep of dependencies) {
        if (dep.isOutdated) {
          outdated.push(dep);
        } else {
          upToDate.push(dep);
        }
      }

      const criticallyOutdated = outdated.filter(dep => 
        dep.monthsBehind && dep.monthsBehind > 12
      ).length;

      console.log(`Outdated check completed: ${outdated.length} outdated packages found`);

      return {
        outdated,
        upToDate,
        summary: {
          total: dependencies.length,
          outdated: outdated.length,
          criticallyOutdated,
        },
      };
    } catch (error) {
      console.error('Outdated dependency check failed:', error);
      throw new Error('Outdated dependency check failed');
    }
  }

  /**
   * Generate dependency update plan
   */
  generateUpdatePlan(dependencies: DependencyInfo[]): {
    immediate: DependencyInfo[]; // Critical vulnerabilities
    planned: DependencyInfo[];   // High/medium vulnerabilities
    optional: DependencyInfo[];  // Low vulnerabilities or outdated
  } {
    const immediate: DependencyInfo[] = [];
    const planned: DependencyInfo[] = [];
    const optional: DependencyInfo[] = [];

    for (const dep of dependencies) {
      const hasCritical = dep.vulnerabilities.some(v => v.severity === 'critical');
      const hasHigh = dep.vulnerabilities.some(v => v.severity === 'high');
      const hasMedium = dep.vulnerabilities.some(v => v.severity === 'medium');

      if (hasCritical) {
        immediate.push(dep);
      } else if (hasHigh || hasMedium) {
        planned.push(dep);
      } else if (dep.isOutdated || dep.vulnerabilities.length > 0) {
        optional.push(dep);
      }
    }

    return { immediate, planned, optional };
  }

  /**
   * Get dependency scanner report
   */
  getDependencyScannerReport(): {
    totalDependencies: number;
    directDependencies: number;
    transitiveDependencies: number;
    outdatedDependencies: number;
    vulnerableDependencies: number;
    licenseIssues: number;
    lastScanDate: Date;
    recommendations: string[];
  } {
    const dependencies = vulnerabilityManagementService.listDependencies();
    const licenses = Array.from(this.licenseCache.values());
    
    const directDeps = dependencies.filter(d => d.type === 'direct').length;
    const transitiveDeps = dependencies.filter(d => d.type === 'transitive').length;
    const outdatedDeps = dependencies.filter(d => d.isOutdated).length;
    const vulnerableDeps = dependencies.filter(d => d.vulnerabilities.length > 0).length;
    const licenseIssues = licenses.filter(l => !l.isCompatible).length;

    const recommendations: string[] = [];
    
    if (outdatedDeps > 0) {
      recommendations.push(`Update ${outdatedDeps} outdated dependencies`);
    }
    
    if (vulnerableDeps > 0) {
      recommendations.push(`Address vulnerabilities in ${vulnerableDeps} dependencies`);
    }
    
    if (licenseIssues > 0) {
      recommendations.push(`Review ${licenseIssues} license compatibility issues`);
    }

    return {
      totalDependencies: dependencies.length,
      directDependencies: directDeps,
      transitiveDependencies: transitiveDeps,
      outdatedDependencies: outdatedDeps,
      vulnerableDependencies: vulnerableDeps,
      licenseIssues,
      lastScanDate: new Date(),
      recommendations,
    };
  }
}

// Export singleton instance
export const dependencyScannerService = DependencyScannerService.getInstance();
export default dependencyScannerService;