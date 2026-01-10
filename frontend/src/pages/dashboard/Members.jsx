import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Briefcase, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [membershipType, setMembershipType] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, membershipType, location]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (membershipType) params.append('membershipType', membershipType);
      if (location) params.append('location', location);
      
      const response = await axios.get(`${API_URL}/api/members?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMembers(response.data.members);
      setTotal(response.data.total);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      setLoading(false);
    }
  };

  const viewMemberProfile = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedMember(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const getMembershipTypeLabel = (type) => {
    const types = {
      individual: 'Particulier',
      professional: 'Professionnel',
      professional_plus: 'Professionnel +',
      association: 'Association'
    };
    return types[type] || type;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Annuaire des Membres</h1>
        <p className="text-gray-600">Découvrez et connectez-vous avec les membres de la communauté</p>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={membershipType} onValueChange={setMembershipType}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'adhésion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="individual">Particulier</SelectItem>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="professional_plus">Professionnel +</SelectItem>
                <SelectItem value="association">Association</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Localisation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <div className="mb-4 text-sm text-gray-600">
        {total} membre{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profilePhoto} />
                    <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {member.firstName} {member.lastName}
                    </CardTitle>
                    {member.businessName && (
                      <CardDescription>{member.businessName}</CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary">
                  {getMembershipTypeLabel(member.membershipType)}
                </Badge>

                {member.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {member.location}
                  </div>
                )}

                {member.businessType && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {member.businessType}
                  </div>
                )}

                {member.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">{member.bio}</p>
                )}

                {member.expertise && member.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => viewMemberProfile(member.id)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Voir le profil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-gray-500">Aucun membre trouvé avec ces critères</p>
          </CardContent>
        </Card>
      )}

      {/* Modal Profil détaillé */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedMember.profilePhoto} />
                    <AvatarFallback>
                      {getInitials(selectedMember.firstName, selectedMember.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </CardTitle>
                    {selectedMember.businessName && (
                      <CardDescription className="text-lg">{selectedMember.businessName}</CardDescription>
                    )}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedMember(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Badge>{getMembershipTypeLabel(selectedMember.membershipType)}</Badge>
              </div>

              {selectedMember.bio && (
                <div>
                  <h3 className="font-semibold mb-2">À propos</h3>
                  <p className="text-gray-600">{selectedMember.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedMember.location && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Localisation</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedMember.location}
                    </div>
                  </div>
                )}

                {selectedMember.businessType && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Activité</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {selectedMember.businessType}
                    </div>
                  </div>
                )}
              </div>

              {selectedMember.expertise && selectedMember.expertise.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Expertises</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.expertise.map((skill, idx) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.stats && (
                <div>
                  <h3 className="font-semibold mb-2">Activité</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedMember.stats.posts}</div>
                      <div className="text-sm text-gray-600">Posts</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedMember.stats.casesShared}</div>
                      <div className="text-sm text-gray-600">Dossiers partagés</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMember.memberSince && (
                <div className="text-sm text-gray-500">
                  Membre depuis {new Date(selectedMember.memberSince).toLocaleDateString('fr-FR')}
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Members;
