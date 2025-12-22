import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { FileText, Upload, Download, Trash2, Eye, Calendar } from 'lucide-react';

const Documents = () => {
  const [documents] = useState([
    {
      id: 1,
      name: 'Contrat de bail commercial.pdf',
      size: '2.4 MB',
      uploadDate: '2025-01-15',
      status: 'validé',
      type: 'Contrat'
    },
    {
      id: 2,
      name: 'Statuts entreprise.pdf',
      size: '1.8 MB',
      uploadDate: '2025-01-10',
      status: 'en cours',
      type: 'Légal'
    },
    {
      id: 3,
      name: 'Facture URSSAF Q4.pdf',
      size: '458 KB',
      uploadDate: '2025-01-05',
      status: 'validé',
      type: 'Administratif'
    },
    {
      id: 4,
      name: 'Attestation assurance.pdf',
      size: '1.2 MB',
      uploadDate: '2024-12-28',
      status: 'validé',
      type: 'Assurance'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'validé':
        return 'bg-green-100 text-green-700';
      case 'en cours':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Documents</h1>
            <p className="text-gray-600">Gérez vos documents juridiques et administratifs</p>
          </div>
          <Button className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700">
            <Upload className="mr-2 h-4 w-4" />
            Uploader un document
          </Button>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Glissez-déposez vos fichiers ici
              </p>
              <p className="text-sm text-gray-600 mb-4">ou cliquez pour sélectionner</p>
              <Input type="file" className="hidden" id="file-upload" />
              <Button variant="outline" onClick={() => document.getElementById('file-upload').click()}>
                Sélectionner des fichiers
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Formats acceptés : PDF, DOCX, JPG, PNG (Max 10 MB)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents uploadés ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-500">{doc.size}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.type}
                        </Badge>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
            <p className="text-sm text-blue-800">
              Nos experts peuvent analyser vos documents et vous fournir des conseils personnalisés.
              Contactez-nous via l'assistant IA ou par téléphone.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
